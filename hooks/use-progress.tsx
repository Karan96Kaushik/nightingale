import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getAllPhrases, PLAN } from '@/lib/curriculum/plan'
import type { SectionId } from '@/lib/curriculum/types'
import {
  addSeconds,
  completedDayCount,
  currentDay,
  readProgress,
  resetProgress as resetStoredProgress,
  totalMinutes,
  writeProgress,
  completeSection as markSectionComplete,
} from '@/lib/progress/storage'
import { createReview, isDue, rateReview } from '@/lib/progress/srs'
import type { ProgressState, ReviewRating } from '@/lib/progress/types'
import { useAuth } from '@/hooks/use-auth'
import { pushProgress } from '@/lib/supabase/cloud-sync'

type ProgressContextValue = {
  progress: ProgressState
  dayNumber: number
  completedDays: number
  minutesStudied: number
  dueReviews: ReturnType<typeof getAllPhrases>
  completeSection: (day: number, section: SectionId) => void
  recordSeconds: (day: number, section: SectionId, seconds: number) => void
  ratePhrase: (phraseId: string, rating: ReviewRating) => void
  resetProgress: () => void
  reload: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, isSyncing } = useAuth()
  const [progress, setProgress] = useState<ProgressState>(() => readProgress())
  const progressRef = useRef(progress)
  progressRef.current = progress
  const pushTimer = useRef<number | null>(null)

  const persist = useCallback(
    (update: ProgressState | ((current: ProgressState) => ProgressState)) => {
      const next = typeof update === 'function' ? update(progressRef.current) : update
      progressRef.current = next
      writeProgress(next)
      setProgress(next)
      if (!user) return
      if (pushTimer.current) window.clearTimeout(pushTimer.current)
      pushTimer.current = window.setTimeout(() => {
        pushProgress(user.id, progressRef.current).catch((err) => console.error('Progress sync failed:', err))
      }, 800)
    },
    [user],
  )

  const reload = useCallback(() => {
    const next = readProgress()
    progressRef.current = next
    setProgress(next)
  }, [])

  useEffect(() => {
    if (!isSyncing) reload()
  }, [user?.id, isSyncing, reload])

  const completeSection = useCallback(
    (day: number, section: SectionId) => {
      persist((current) => markSectionComplete(current, day, section))
    },
    [persist],
  )

  const recordSeconds = useCallback(
    (day: number, section: SectionId, seconds: number) => {
      persist((current) => addSeconds(current, day, section, seconds))
    },
    [persist],
  )

  const ratePhrase = useCallback(
    (phraseId: string, rating: ReviewRating) => {
      persist((current) => {
        const review = current.reviews[phraseId] ?? createReview(phraseId)
        return {
          ...current,
          reviews: {
            ...current.reviews,
            [phraseId]: rateReview(review, rating),
          },
          updatedAt: new Date().toISOString(),
        }
      })
    },
    [persist],
  )

  const resetProgress = useCallback(() => {
    persist(resetStoredProgress())
  }, [persist])

  const dueReviews = useMemo(() => {
    const phrases = getAllPhrases()
    const startedDays = new Set(Object.keys(progress.days).map(Number))
    return phrases.filter((phrase) => {
      const review = progress.reviews[phrase.id]
      if (review) return isDue(review)
      return startedDays.has(phrase.day)
    })
  }, [progress.reviews, progress.days])

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      dayNumber: currentDay(progress),
      completedDays: completedDayCount(progress),
      minutesStudied: totalMinutes(progress),
      dueReviews,
      completeSection,
      recordSeconds,
      ratePhrase,
      resetProgress,
      reload,
    }),
    [progress, dueReviews, completeSection, recordSeconds, ratePhrase, resetProgress, reload],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}

export function useDayProgress(day: number) {
  const { progress } = useProgress()
  return progress.days[String(day)]
}

export function dayTitle(day: number) {
  return PLAN.find((item) => item.day === day)?.title ?? `Day ${day}`
}

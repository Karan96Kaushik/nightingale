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
  const pushTimer = useRef<number | null>(null)

  const persist = useCallback(
    (next: ProgressState) => {
      writeProgress(next)
      setProgress(next)
      if (!user) return
      if (pushTimer.current) window.clearTimeout(pushTimer.current)
      pushTimer.current = window.setTimeout(() => {
        pushProgress(user.id, next).catch((err) => console.error('Progress sync failed:', err))
      }, 800)
    },
    [user],
  )

  const reload = useCallback(() => {
    setProgress(readProgress())
  }, [])

  useEffect(() => {
    if (!isSyncing) reload()
  }, [user?.id, isSyncing, reload])

  const completeSection = useCallback(
    (day: number, section: SectionId) => {
      persist(markSectionComplete(progress, day, section))
    },
    [persist, progress],
  )

  const recordSeconds = useCallback(
    (day: number, section: SectionId, seconds: number) => {
      persist(addSeconds(progress, day, section, seconds))
    },
    [persist, progress],
  )

  const ratePhrase = useCallback(
    (phraseId: string, rating: ReviewRating) => {
      const current = progress.reviews[phraseId] ?? createReview(phraseId)
      persist({
        ...progress,
        reviews: {
          ...progress.reviews,
          [phraseId]: rateReview(current, rating),
        },
        updatedAt: new Date().toISOString(),
      })
    },
    [persist, progress],
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

import type { SectionId } from '@/lib/curriculum/types'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export type PhraseReview = {
  phraseId: string
  ease: number
  intervalDays: number
  repetitions: number
  dueAt: string
  lastRating?: ReviewRating
  lastReviewedAt?: string
}

export type SectionProgress = {
  completed: boolean
  secondsSpent: number
  completedAt?: string
}

export type DayProgress = {
  sections: Record<SectionId, SectionProgress>
  completedAt?: string
}

export type ProgressState = {
  updatedAt: string
  startedAt: string | null
  days: Record<string, DayProgress>
  reviews: Record<string, PhraseReview>
  lastStudyDate: string | null
  streak: number
}

export const EMPTY_SECTION: SectionProgress = { completed: false, secondsSpent: 0 }

export function emptyDayProgress(): DayProgress {
  return {
    sections: {
      vocab: { ...EMPTY_SECTION },
      grammar: { ...EMPTY_SECTION },
      listen: { ...EMPTY_SECTION },
      practice: { ...EMPTY_SECTION },
    },
  }
}

export function createEmptyProgress(): ProgressState {
  return {
    updatedAt: new Date(0).toISOString(),
    startedAt: null,
    days: {},
    reviews: {},
    lastStudyDate: null,
    streak: 0,
  }
}

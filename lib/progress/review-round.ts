import { getAllPhrases } from '@/lib/curriculum/plan'
import { isDue } from './srs'
import type { PhraseReview, ProgressState } from './types'

export type ReviewPhrase = ReturnType<typeof getAllPhrases>[number]

/** due: scheduled for today. new: never rated. practice: pulled early from a finished day. retry: rated Again this round. */
export type ReviewCardKind = 'due' | 'new' | 'practice' | 'retry'

export type ReviewCard = {
  phrase: ReviewPhrase
  kind: ReviewCardKind
}

export const REVIEW_ROUND_SIZE = 15
const MS_DAY = 24 * 60 * 60 * 1000

function weakness(review: PhraseReview | undefined) {
  if (!review) return 3
  let score = Math.max(0, 2.5 - review.ease) * 2
  if (review.lastRating === 'again') score += 3
  else if (review.lastRating === 'hard') score += 2
  if (review.repetitions === 0) score += 1
  return score
}

function daysSinceSeen(review: PhraseReview, now: Date) {
  const seen = review.lastReviewedAt
    ? new Date(review.lastReviewedAt).getTime()
    : new Date(review.dueAt).getTime() - review.intervalDays * MS_DAY
  return Math.max(0, (now.getTime() - seen) / MS_DAY)
}

/** Efraimidis–Spirakis: sample without replacement, heavier items first more often. */
function weightedSample<T>(items: T[], weight: (item: T) => number, count: number) {
  return items
    .map((item) => ({ item, key: Math.random() ** (1 / Math.max(weight(item), 0.01)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((entry) => entry.item)
}

function interleave(primary: ReviewCard[], extra: ReviewCard[]) {
  const total = primary.length + extra.length
  const out: ReviewCard[] = []
  let p = 0
  let x = 0
  for (let i = 0; i < total; i++) {
    const takeExtra = x < extra.length && (p >= primary.length || (x + 0.5) * total <= (i + 1) * extra.length)
    out.push(takeExtra ? extra[x++] : primary[p++])
  }
  return out
}

export function isDayLearned(progress: ProgressState, day: number) {
  const saved = progress.days[String(day)]
  return Boolean(saved?.completedAt || saved?.sections.vocab.completed)
}

/** Days the learner has opened that have phrases, oldest first. */
export function reviewableDays(progress: ProgressState) {
  const started = new Set(Object.keys(progress.days).map(Number))
  return [...new Set(getAllPhrases().map((phrase) => phrase.day))].filter((day) => started.has(day)).sort((a, b) => a - b)
}

/**
 * Due and new cards come first, weakest first. About a third of the round is kept for
 * phrases from finished days that are not due yet, so older days keep coming back.
 * Picking a day reviews only that day, including phrases that are not due.
 */
export function buildReviewRound(
  progress: ProgressState,
  { day, size = REVIEW_ROUND_SIZE, now = new Date() }: { day?: number | null; size?: number; now?: Date } = {},
): ReviewCard[] {
  const started = new Set(Object.keys(progress.days).map(Number))
  const due: ReviewPhrase[] = []
  const fresh: ReviewPhrase[] = []
  const pool: ReviewPhrase[] = []

  for (const phrase of getAllPhrases()) {
    if (day != null && phrase.day !== day) continue
    const review = progress.reviews[phrase.id]
    if (review && isDue(review, now)) due.push(phrase)
    else if (!review && started.has(phrase.day)) fresh.push(phrase)
    else if (review && (day != null || isDayLearned(progress, phrase.day))) pool.push(phrase)
  }

  due.sort((a, b) => {
    const ra = progress.reviews[a.id]
    const rb = progress.reviews[b.id]
    return weakness(rb) - weakness(ra) || new Date(ra.dueAt).getTime() - new Date(rb.dueAt).getTime()
  })

  const priority: ReviewCard[] = [
    ...due.map((phrase) => ({ phrase, kind: 'due' as const })),
    ...fresh.map((phrase) => ({ phrase, kind: 'new' as const })),
  ]
  const practiceSlots = Math.min(pool.length, Math.max(size - priority.length, Math.round(size / 3)))
  const practice = weightedSample(
    pool,
    (phrase) => {
      const review = progress.reviews[phrase.id]
      return 1 + weakness(review) + Math.min(daysSinceSeen(review, now), 21) / 7
    },
    practiceSlots,
  ).map((phrase) => ({ phrase, kind: 'practice' as const }))

  return interleave(priority.slice(0, size - practiceSlots), practice)
}

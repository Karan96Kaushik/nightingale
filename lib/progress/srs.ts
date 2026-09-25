import type { PhraseReview, ReviewRating } from './types'

const MS_DAY = 24 * 60 * 60 * 1000

export function createReview(phraseId: string, now = new Date()): PhraseReview {
  return {
    phraseId,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now.toISOString(),
  }
}

export function rateReview(review: PhraseReview, rating: ReviewRating, now = new Date()): PhraseReview {
  let { ease, intervalDays, repetitions } = review

  if (rating === 'again') {
    repetitions = 0
    intervalDays = 0
  } else {
    repetitions += 1
    if (rating === 'hard') {
      ease = Math.max(1.3, ease - 0.15)
      intervalDays = repetitions === 1 ? 1 : Math.max(1, Math.round(intervalDays * 1.2))
    } else if (rating === 'good') {
      intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(intervalDays * ease)
    } else {
      ease += 0.15
      intervalDays = repetitions === 1 ? 2 : repetitions === 2 ? 6 : Math.round(intervalDays * ease * 1.3)
    }
  }

  return {
    ...review,
    ease,
    intervalDays,
    repetitions,
    lastRating: rating,
    dueAt: new Date(now.getTime() + intervalDays * MS_DAY).toISOString(),
  }
}

export function isDue(review: PhraseReview, now = new Date()) {
  return new Date(review.dueAt).getTime() <= now.getTime()
}

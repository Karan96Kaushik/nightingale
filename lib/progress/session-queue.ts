import { createReview, isDue, rateReview } from './srs'
import type { PhraseReview, ReviewRating } from './types'

/** Still-due cards return after this many later cards, or sooner when fewer remain. */
export const SESSION_RETRY_GAP = 1

export type SessionCard = {
  index: number
  retry: boolean
}

export function initialSessionQueue(count: number): SessionCard[] {
  return Array.from({ length: count }, (_, index) => ({ index, retry: false }))
}

/** True when this rating leaves the phrase due, so the session should show it again. */
export function cardRemainsDue(
  review: PhraseReview | undefined,
  phraseId: string,
  rating: ReviewRating,
  now = new Date(),
) {
  const current = review ?? createReview(phraseId, now)
  return isDue(rateReview(current, rating, now), now)
}

/**
 * Move past the current card. A card that is still due comes back soon on its
 * first miss, then behind any phrases not shown yet. A card the rating cleared
 * stays out, so a short due list does not restart the whole deck.
 */
export function advanceSessionQueue(
  queue: SessionCard[],
  position: number,
  stillDue: boolean,
  gap = SESSION_RETRY_GAP,
): { queue: SessionCard[]; position: number } {
  if (!stillDue || position < 0 || position >= queue.length) {
    return { queue, position: position + 1 }
  }
  const card = queue[position]
  const next = queue.slice()
  const insertAt = card.retry ? next.length : Math.min(position + 1 + gap, next.length)
  next.splice(insertAt, 0, { index: card.index, retry: true })
  return { queue: next, position: position + 1 }
}

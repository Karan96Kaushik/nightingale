import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RotateCcw, Volume2 } from 'lucide-react'
import { playSpanishClip, stopDialogue } from '@/lib/audio/dialogue-player'
import { vocabAudioSrc } from '@/lib/audio/dialogue-path'
import { getDay } from '@/lib/curriculum/plan'
import { buildReviewRound, reviewableDays, type ReviewCard, type ReviewCardKind } from '@/lib/progress/review-round'
import { cn } from '@/lib/utils'
import { useProgress } from '@/hooks/use-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ReverseVocabToggle, readReverseVocab, writeReverseVocab } from '@/components/learn/reverse-vocab-toggle'
import type { ReviewRating } from '@/lib/progress/types'

const RATINGS: { id: ReviewRating; label: string; variant: 'outline' | 'secondary' | 'default' }[] = [
  { id: 'again', label: 'Again', variant: 'outline' },
  { id: 'hard', label: 'Hard', variant: 'outline' },
  { id: 'good', label: 'Good', variant: 'secondary' },
  { id: 'easy', label: 'Easy', variant: 'default' },
]

const KIND_LABEL: Record<ReviewCardKind, string> = {
  due: 'Due',
  new: 'New',
  practice: 'Older day',
  retry: 'Once more',
}

/** Cards rated Again come back this many cards later in the same round. */
const RETRY_GAP = 4

const EMPTY_TALLY: Record<ReviewRating, number> = { again: 0, hard: 0, good: 0, easy: 0 }

export function ReviewPage() {
  const { progress, dueReviews, ratePhrase } = useProgress()
  const [dayFilter, setDayFilter] = useState<number | null>(null)
  const [queue, setQueue] = useState<ReviewCard[]>(() => buildReviewRound(progress))
  const [position, setPosition] = useState(0)
  const [tally, setTally] = useState(EMPTY_TALLY)
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(readReverseVocab)
  const days = useMemo(() => reviewableDays(progress), [progress])
  const card = queue[position] as ReviewCard | undefined
  const phrase = card?.phrase

  useEffect(() => () => stopDialogue(), [])

  // Progress can arrive from cloud sync after the page opens; rebuild while the round is untouched.
  useEffect(() => {
    if (position === 0) setQueue(buildReviewRound(progress, { day: dayFilter }))
  }, [progress.days, progress.reviews])

  const startRound = (day: number | null = dayFilter) => {
    stopDialogue()
    setDayFilter(day)
    setQueue(buildReviewRound(progress, { day }))
    setPosition(0)
    setTally(EMPTY_TALLY)
    setFlipped(false)
  }

  const rate = (rating: ReviewRating) => {
    if (!card) return
    ratePhrase(card.phrase.id, rating)
    setTally((value) => ({ ...value, [rating]: value[rating] + 1 }))
    if (rating === 'again') {
      setQueue((value) => {
        const next = [...value]
        next.splice(Math.min(position + 1 + RETRY_GAP, next.length), 0, { phrase: card.phrase, kind: 'retry' })
        return next
      })
    }
    setPosition((value) => value + 1)
    setFlipped(false)
  }

  const toggleReverse = () => {
    setReversed((value) => {
      const next = !value
      writeReverseVocab(next)
      return next
    })
    setFlipped(false)
  }

  const prompt = phrase ? (reversed ? phrase.english : phrase.spanish) : ''
  const answer = phrase ? (reversed ? phrase.spanish : phrase.english) : ''
  const answerLanguage = reversed ? 'Spanish' : 'English'
  const rated = tally.again + tally.hard + tally.good + tally.easy
  const scope = dayFilter == null ? 'all days' : `day ${dayFilter}`

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="font-display text-3xl">Spaced review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Due and weak phrases come first. Each round also brings back phrases from days you finished.
        </p>
      </header>

      {days.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip active={dayFilter == null} onClick={() => startRound(null)}>
            All days · {dueReviews.length} due
          </FilterChip>
          {days.map((day) => (
            <FilterChip key={day} active={dayFilter === day} onClick={() => startRound(day)}>
              Day {day}
            </FilterChip>
          ))}
        </div>
      )}

      {queue.length === 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="font-display text-xl">Nothing to review yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Start today’s lesson. Phrases from the days you open show up here.
          </p>
        </div>
      ) : !card || !phrase ? (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <p className="font-display text-xl">Round complete</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You rated {rated} {rated === 1 ? 'card' : 'cards'} from {scope}.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {RATINGS.map((rating) => (
              <div key={rating.id} className="rounded-lg bg-muted px-2 py-2">
                <p className="font-display text-xl">{tally[rating.id]}</p>
                <p className="text-xs text-muted-foreground">{rating.label}</p>
              </div>
            ))}
          </div>
          <Button type="button" className="w-full" onClick={() => startRound()}>
            <RotateCcw /> Start another round
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
              <span>
                Card {position + 1} of {queue.length}
              </span>
              <span>{scope}</span>
            </div>
            <Progress value={(position / queue.length) * 100} />
          </div>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="flex min-h-56 flex-col justify-between gap-4 rounded-2xl border bg-card p-6 text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={card.kind === 'practice' ? 'secondary' : card.kind === 'retry' ? 'outline' : 'default'}>
                {KIND_LABEL[card.kind]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Day {phrase.day} · {getDay(phrase.day)?.title}
              </span>
            </div>
            <div>
              <p className="font-display text-3xl leading-tight">{prompt}</p>
              {flipped && (
                <div className="mt-4 space-y-1">
                  <p className="text-lg">{answer}</p>
                  {phrase.note && <p className="text-sm text-muted-foreground">{phrase.note}</p>}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {flipped ? `Tap to hide ${answerLanguage}` : `Tap to show ${answerLanguage}`}
            </p>
          </button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void playSpanishClip(vocabAudioSrc(phrase.day, phrase.index), phrase.spanish)}
          >
            <Volume2 /> Hear it
          </Button>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((rating) => (
              <Button key={rating.id} type="button" variant={rating.variant} onClick={() => rate(rating.id)}>
                {rating.label}
              </Button>
            ))}
          </div>
        </>
      )}
      <ReverseVocabToggle reversed={reversed} onToggle={toggleReverse} />
    </main>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { getDay } from '@/lib/curriculum/plan'
import { paths } from '@/lib/routes'
import { speakSpanish } from '@/lib/speech'
import { useDayProgress, useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { SessionActions } from '@/components/learn/session-actions'
import { SessionTimer } from '@/components/learn/session-timer'
import type { ReviewRating } from '@/lib/progress/types'

export function VocabSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds, ratePhrase, progress } = useProgress()
  const done = Boolean(useDayProgress(dayNumber)?.sections.vocab.completed)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const phrases = day?.phrases ?? []
  const phrase = phrases[index]
  const dueCount = useMemo(
    () => phrases.filter((item) => !progress.reviews[item.id] || new Date(progress.reviews[item.id].dueAt) <= new Date()).length,
    [phrases, progress.reviews],
  )

  const onTick = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(dayNumber)) return
      recordSeconds(dayNumber, 'vocab', seconds)
    },
    [dayNumber, recordSeconds],
  )

  if (!day || !phrase) {
    return (
      <main className="px-4 py-8">
        <p>No vocabulary for this day.</p>
      </main>
    )
  }

  const rate = (rating: ReviewRating) => {
    ratePhrase(phrase.id, rating)
    setFlipped(false)
    setIndex((value) => (value + 1) % phrases.length)
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <Link
        to={paths.day(day.day)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Day {day.day}
      </Link>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Vocabulary · phrases, not words</p>
        <h1 className="font-display text-2xl">{day.vocabFocus}</h1>
      </div>
      <SessionTimer onTick={onTick} />

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="flex min-h-44 flex-col justify-between rounded-2xl border bg-card p-5 text-left shadow-sm"
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Card {index + 1} of {phrases.length} · {dueCount} due
        </p>
        <div>
          <p className="font-display text-3xl leading-tight">{phrase.spanish}</p>
          {flipped && (
            <div className="mt-4 space-y-1">
              <p className="text-lg">{phrase.english}</p>
              {phrase.note && <p className="text-sm text-muted-foreground">{phrase.note}</p>}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{flipped ? 'Tap to hide English' : 'Tap to show English'}</p>
      </button>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => speakSpanish(phrase.spanish)}>
          <Volume2 /> Hear it
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button type="button" variant="outline" onClick={() => rate('again')}>
          Again
        </Button>
        <Button type="button" variant="outline" onClick={() => rate('hard')}>
          Hard
        </Button>
        <Button type="button" variant="secondary" onClick={() => rate('good')}>
          Good
        </Button>
        <Button type="button" onClick={() => rate('easy')}>
          Easy
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Aim for 10–15 phrases. Learn chunks like <em>Quiero comer</em>, not isolated words.
      </p>

      <SessionActions
        done={done}
        completeLabel="Mark vocabulary complete"
        doneLabel="Vocabulary complete"
        onComplete={() => completeSection(day.day, 'vocab')}
        continueTo={paths.section(day.day, 'grammar')}
        continueLabel="Continue to grammar"
      />
    </main>
  )
}

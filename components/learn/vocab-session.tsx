import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { playSpanishClip, stopDialogue } from '@/lib/audio/dialogue-player'
import { vocabAudioSrc } from '@/lib/audio/dialogue-path'
import { getDay } from '@/lib/curriculum/plan'
import { paths } from '@/lib/routes'
import { useDayProgress, useProgress } from '@/hooks/use-progress'
import { isDue } from '@/lib/progress/srs'
import { advanceSessionQueue, cardRemainsDue, initialSessionQueue } from '@/lib/progress/session-queue'
import { Button } from '@/components/ui/button'
import { ReverseVocabToggle, readReverseVocab, writeReverseVocab } from '@/components/learn/reverse-vocab-toggle'
import { SessionActions } from '@/components/learn/session-actions'
import { SessionTimer } from '@/components/learn/session-timer'
import { VocabTutorial } from '@/components/learn/vocab-tutorial'
import type { ReviewRating } from '@/lib/progress/types'

export function VocabSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds, ratePhrase, progress } = useProgress()
  const done = Boolean(useDayProgress(dayNumber)?.sections.vocab.completed)
  const [session, setSession] = useState(() => ({
    queue: initialSessionQueue(day?.phrases.length ?? 0),
    position: 0,
  }))
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(readReverseVocab)

  const phrases = day?.phrases ?? []
  const { queue, position } = session
  const card = queue[position]
  const phrase = card ? phrases[card.index] : undefined
  const dueCount = useMemo(
    () =>
      phrases.filter((item) => {
        const review = progress.reviews[item.id]
        return !review || isDue(review)
      }).length,
    [phrases, progress.reviews],
  )

  useEffect(() => () => stopDialogue(), [])

  useEffect(() => {
    setSession({ queue: initialSessionQueue(phrases.length), position: 0 })
    setFlipped(false)
  }, [dayNumber, phrases.length])

  const onTick = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(dayNumber)) return
      recordSeconds(dayNumber, 'vocab', seconds)
    },
    [dayNumber, recordSeconds],
  )

  if (!day || phrases.length === 0) {
    return (
      <main className="px-4 py-8">
        <p>No vocabulary for this day.</p>
      </main>
    )
  }

  const rate = (rating: ReviewRating) => {
    if (!phrase || !card) return
    const stillDue = cardRemainsDue(progress.reviews[phrase.id], phrase.id, rating)
    ratePhrase(phrase.id, rating)
    setFlipped(false)
    setSession((current) => advanceSessionQueue(current.queue, current.position, stillDue))
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
      <VocabTutorial />
      <SessionTimer onTick={onTick} />

      {phrase && card ? (
        <>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="flex min-h-44 flex-col justify-between rounded-2xl border bg-card p-5 text-left shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {card.retry ? 'Once more · ' : ''}
              Card {position + 1} of {queue.length} · {dueCount} due
            </p>
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => void playSpanishClip(vocabAudioSrc(day.day, card.index), phrase.spanish)}
            >
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
        </>
      ) : (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-xl">No phrases due</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Again keeps a phrase in this session while it is still due.
          </p>
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        Aim for 10–15 phrases. Learn chunks like <em>Quiero comer</em>, not isolated words.
      </p>

      <ReverseVocabToggle reversed={reversed} onToggle={toggleReverse} />

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

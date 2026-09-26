import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { playSpanishClip, stopDialogue } from '@/lib/audio/dialogue-player'
import { vocabAudioSrc } from '@/lib/audio/dialogue-path'
import { useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { ReverseVocabToggle, readReverseVocab, writeReverseVocab } from '@/components/learn/reverse-vocab-toggle'
import type { ReviewRating } from '@/lib/progress/types'

export function ReviewPage() {
  const { dueReviews, ratePhrase } = useProgress()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(readReverseVocab)
  const phrase = dueReviews[index]

  useEffect(() => () => stopDialogue(), [])

  const rate = (rating: ReviewRating) => {
    if (!phrase) return
    ratePhrase(phrase.id, rating)
    setFlipped(false)
    setIndex((value) => {
      const nextLength = Math.max(dueReviews.length - 1, 0)
      if (nextLength === 0) return 0
      return value >= nextLength ? 0 : value
    })
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
      <header>
        <h1 className="font-display text-3xl">Spaced review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Weak phrases come back first. Review in phrases, then keep speaking.
        </p>
      </header>

      {!phrase ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="font-display text-xl">You are caught up.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No cards are due. Do today’s lesson, or revisit a day from the plan.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {dueReviews.length} due · from day {phrase.day}
          </p>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="flex min-h-56 flex-col justify-between rounded-2xl border bg-card p-6 text-left"
          >
            <p className="font-display text-3xl leading-tight">{prompt}</p>
            {flipped && <p className="text-lg">{answer}</p>}
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
      )}
      <ReverseVocabToggle reversed={reversed} onToggle={toggleReverse} />
    </main>
  )
}

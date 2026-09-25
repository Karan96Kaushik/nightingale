import { useCallback, useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'nightingale_vocab_tutorial_seen'

const RATINGS = [
  { label: 'Again', detail: 'You missed it. It comes back right away.' },
  { label: 'Hard', detail: 'You got it slowly. It comes back soon.' },
  { label: 'Good', detail: 'You recalled it normally.' },
  { label: 'Easy', detail: 'You knew it immediately. It comes back later.' },
]

function hasSeenVocabTutorial() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function markVocabTutorialSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Storage can be blocked; closing still dismisses this visit.
  }
}

export function VocabTutorial() {
  const titleId = useId()
  const [open, setOpen] = useState(() => !hasSeenVocabTutorial())

  const dismiss = useCallback(() => {
    markVocabTutorialSeen()
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismiss, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-xl">
          How to rate a phrase
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Flip the card, then choose how well you recalled the Spanish.
        </p>
        <ul className="mt-4 space-y-3">
          {RATINGS.map((rating) => (
            <li key={rating.label}>
              <p className="text-sm font-medium">{rating.label}</p>
              <p className="text-sm text-muted-foreground">{rating.detail}</p>
            </li>
          ))}
        </ul>
        <Button type="button" className="mt-5 w-full" onClick={dismiss} autoFocus>
          Got it
        </Button>
      </div>
    </div>
  )
}

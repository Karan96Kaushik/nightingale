import { cn } from '@/lib/utils'

const REVERSE_KEY = 'nightingale_vocab_reverse'

export function readReverseVocab() {
  try {
    return localStorage.getItem(REVERSE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeReverseVocab(reversed: boolean) {
  try {
    localStorage.setItem(REVERSE_KEY, reversed ? '1' : '0')
  } catch {
    // Storage can be blocked; the toggle still works for this visit.
  }
}

export function ReverseVocabToggle({ reversed, onToggle }: { reversed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={reversed}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-medium">Reverse vocabulary</span>
        <span className="block text-xs text-muted-foreground">
          {reversed ? 'English first. Tap the card for Spanish.' : 'Spanish first. Tap the card for English.'}
        </span>
      </span>
      <span
        aria-hidden
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', reversed ? 'bg-primary' : 'bg-border')}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-card shadow-sm transition-transform',
            reversed ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

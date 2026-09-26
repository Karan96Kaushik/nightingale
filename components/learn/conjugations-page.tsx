import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Volume2 } from 'lucide-react'
import {
  CONJUGATION_GROUPS,
  conjugationPersonLabel,
  type VerbConjugation,
} from '@/lib/curriculum/conjugations'
import { paths } from '@/lib/routes'
import { speakSpanish, stopSpeaking } from '@/lib/speech'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const COVER_KEY = 'nightingale_conjugations_covered'

function readCovered() {
  try {
    return localStorage.getItem(COVER_KEY) === '1'
  } catch {
    return false
  }
}

function writeCovered(covered: boolean) {
  try {
    localStorage.setItem(COVER_KEY, covered ? '1' : '0')
  } catch {
    // Storage can be blocked; the toggle still works for this visit.
  }
}

function CoverToggle({ covered, onToggle }: { covered: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={covered}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-medium">Cover the forms</span>
        <span className="block text-xs text-muted-foreground">
          {covered ? 'The Spanish is hidden. Tap a row to check it.' : 'All five forms are visible.'}
        </span>
      </span>
      <span
        aria-hidden
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', covered ? 'bg-primary' : 'bg-border')}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-card shadow-sm transition-transform',
            covered ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

export function ConjugationsPage() {
  const [verbId, setVerbId] = useState(CONJUGATION_GROUPS[0].verbs[0].id)
  const [covered, setCovered] = useState(readCovered)
  const [revealed, setRevealed] = useState<string[]>([])
  const hearGeneration = useRef(0)
  const verb = CONJUGATION_GROUPS.flatMap((group) => group.verbs).find((item) => item.id === verbId) ?? CONJUGATION_GROUPS[0].verbs[0]

  useEffect(
    () => () => {
      hearGeneration.current += 1
      stopSpeaking()
    },
    [],
  )

  const stopHearing = () => {
    hearGeneration.current += 1
    stopSpeaking()
  }

  const selectVerb = (next: VerbConjugation) => {
    stopHearing()
    setVerbId(next.id)
    setRevealed([])
  }

  const toggleCovered = () => {
    setCovered((value) => {
      const next = !value
      writeCovered(next)
      return next
    })
    setRevealed([])
  }

  const showForm = (person: string, spanish: string) => {
    stopHearing()
    setRevealed((current) => (current.includes(person) ? current : [...current, person]))
    void speakSpanish(spanish)
  }

  const hearAll = async () => {
    const generation = ++hearGeneration.current
    for (const form of verb.forms) {
      if (generation !== hearGeneration.current) return
      await speakSpanish(form.spanish)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <Link
        to={paths.home()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Today
      </Link>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Separate from the daily phrases</p>
        <h1 className="font-display text-3xl">Conjugations</h1>
        <p className="text-sm text-muted-foreground">
          Common verbs in the present. Five forms only: yo, tú, él or ella, nosotros, and ellos or ellas. Regular -ar,
          -er, and -ir endings stay on day 10.
        </p>
      </header>

      {CONJUGATION_GROUPS.map((group) => (
        <section key={group.id} className="space-y-2">
          <div>
            <h2 className="text-sm font-medium">{group.title}</h2>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.verbs.map((item) => {
              const selected = item.id === verb.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectVerb(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted/60',
                  )}
                >
                  {item.infinitive}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{verb.infinitive}</h2>
            <p className="text-sm text-muted-foreground">{verb.english}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void hearAll()}>
            <Volume2 /> Hear all
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{verb.note}</p>
        <div className="space-y-2">
          {verb.forms.map((form) => {
            const shown = !covered || revealed.includes(form.person)
            const person = conjugationPersonLabel(form.person)
            return (
              <button
                key={form.person}
                type="button"
                onClick={() => showForm(form.person, form.spanish)}
                aria-label={
                  shown
                    ? `${person}, ${form.spanish}, ${form.english}`
                    : `${person}, ${form.english}. Show the Spanish form.`
                }
                className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left"
              >
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">{person}</span>
                  <span className="block font-display text-2xl leading-tight">{shown ? form.spanish : '· · ·'}</span>
                </span>
                <span className="flex items-center gap-2 text-right">
                  <span className="text-sm text-muted-foreground">{form.english}</span>
                  <Volume2 className="size-4 shrink-0 text-muted-foreground" />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <CoverToggle covered={covered} onToggle={toggleCovered} />
    </main>
  )
}

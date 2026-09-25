import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { getDay } from '@/lib/curriculum/plan'
import { SECTIONS } from '@/lib/curriculum/types'
import { paths } from '@/lib/routes'
import { speakSpanish } from '@/lib/speech'
import { useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { SessionTimer } from '@/components/learn/session-timer'

export function GrammarSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds } = useProgress()

  const onTick = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(dayNumber)) return
      recordSeconds(dayNumber, 'grammar', seconds)
    },
    [dayNumber, recordSeconds],
  )

  if (!day) {
    return (
      <main className="px-4 py-8">
        <p>No grammar for this day.</p>
      </main>
    )
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Grammar · only what today needs</p>
        <h1 className="font-display text-2xl">{day.grammarFocus}</h1>
      </div>
      <SessionTimer minutes={SECTIONS.find((section) => section.id === 'grammar')?.minutes ?? 5} onTick={onTick} />

      {day.grammar.points.map((point) => (
        <section key={point.title} className="space-y-3 rounded-xl border bg-card p-4">
          <div>
            <h2 className="font-display text-lg">{point.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{point.rule}</p>
          </div>
          <div className="space-y-2">
            {point.examples.map((example) => (
              <button
                key={example.spanish}
                type="button"
                onClick={() => speakSpanish(example.spanish)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left"
              >
                <span>
                  <span className="block font-display text-lg">{example.spanish}</span>
                  <span className="block text-sm text-muted-foreground">{example.english}</span>
                </span>
                <Volume2 className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      ))}

      <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Leave for later: {day.grammar.notYet}
      </p>

      <Button type="button" className="mt-auto" onClick={() => completeSection(day.day, 'grammar')}>
        Mark grammar complete
      </Button>
      <Button asChild variant="ghost">
        <Link to={paths.section(day.day, 'listen')}>Continue to listening</Link>
      </Button>
    </main>
  )
}

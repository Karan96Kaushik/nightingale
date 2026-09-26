import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, Lightbulb, TriangleAlert, Volume2 } from 'lucide-react'
import { playSpanishClip, stopDialogue } from '@/lib/audio/dialogue-player'
import { grammarAudioSrc } from '@/lib/audio/dialogue-path'
import { getDay } from '@/lib/curriculum/plan'
import { SECTIONS, type GrammarCheck, type GrammarPoint, type GrammarTable } from '@/lib/curriculum/types'
import { paths } from '@/lib/routes'
import { speakSpanish } from '@/lib/speech'
import { useDayProgress, useProgress } from '@/hooks/use-progress'
import { SessionActions } from '@/components/learn/session-actions'
import { SessionTimer } from '@/components/learn/session-timer'

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{children}</h3>
}

function FormsTable({ table }: { table: GrammarTable }) {
  return (
    <div className="space-y-2">
      {table.title && <SubHeading>{table.title}</SubHeading>}
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full border-y text-left text-sm">
          <thead>
            <tr>
              {table.columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="whitespace-nowrap px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border/60">
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th key={cellIndex} scope="row" className="px-2 py-2 align-top font-normal text-muted-foreground">
                      {cell}
                    </th>
                  ) : (
                    <td key={cellIndex} className="px-2 py-2 align-top font-display text-base leading-snug">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PointCard({
  day,
  point,
  pointIndex,
  total,
}: {
  day: number
  point: GrammarPoint
  pointIndex: number
  total: number
}) {
  return (
    <section className="space-y-6 rounded-2xl border bg-card p-5">
      <header className="space-y-3">
        {total > 1 && (
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            Point {pointIndex + 1} of {total}
          </p>
        )}
        <h2 className="font-display text-2xl leading-tight">{point.title}</h2>
        {point.pattern && (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-display text-base text-foreground">
            {point.pattern}
          </p>
        )}
        <p className="text-[15px] leading-7 text-foreground/80">{point.rule}</p>
      </header>

      {point.tables?.map((table, index) => <FormsTable key={index} table={table} />)}

      <div className="space-y-2">
        <SubHeading>Examples · tap to hear</SubHeading>
        <div className="space-y-2">
          {point.examples.map((example, exampleIndex) => (
            <button
              key={exampleIndex}
              type="button"
              onClick={() => void playSpanishClip(grammarAudioSrc(day, pointIndex, exampleIndex), example.spanish)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left hover:bg-muted/50"
            >
              <span>
                <span className="block font-display text-lg leading-snug">{example.spanish}</span>
                <span className="block text-sm text-muted-foreground">{example.english}</span>
              </span>
              <Volume2 className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {point.tips && point.tips.length > 0 && (
        <div className="space-y-2">
          <SubHeading>Keep in mind</SubHeading>
          <ul className="space-y-2">
            {point.tips.map((tip, index) => (
              <li key={index} className="flex gap-3 text-sm leading-6 text-foreground/80">
                <Lightbulb className="mt-1 size-4 shrink-0 text-primary" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {point.mistakes && point.mistakes.length > 0 && (
        <div className="space-y-2">
          <SubHeading>Common mistakes</SubHeading>
          <ul className="space-y-2">
            {point.mistakes.map((mistake, index) => (
              <li key={index} className="rounded-lg border border-dashed px-3 py-3">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
                  <span className="sr-only">Avoid:</span>
                  <span className="text-muted-foreground line-through decoration-destructive/70">{mistake.avoid}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="sr-only">Say:</span>
                  <span className="font-display text-base text-foreground">{mistake.say}</span>
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{mistake.why}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function CheckYourself({ items }: { items: GrammarCheck[] }) {
  const [revealed, setRevealed] = useState<number[]>([])

  const reveal = (index: number, answer: string) => {
    setRevealed((current) => (current.includes(index) ? current : [...current, index]))
    stopDialogue()
    void speakSpanish(answer.replace(/ \/ /g, '. '))
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-display text-xl">Check yourself</h2>
        <p className="mt-1 text-sm text-muted-foreground">Say it out loud first, then tap to check.</p>
      </div>
      <ol className="space-y-2">
        {items.map((item, index) => {
          const shown = revealed.includes(index)
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => reveal(index, item.answer)}
                aria-expanded={shown}
                className="flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left hover:bg-muted/50"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{item.prompt}</span>
                  {shown ? (
                    <span className="mt-1 block font-display text-lg leading-snug text-primary">{item.answer}</span>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3.5" /> Show answer
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function GrammarSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds } = useProgress()
  const done = Boolean(useDayProgress(dayNumber)?.sections.grammar.completed)

  useEffect(() => () => stopDialogue(), [])

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

  const { points, check, notYet } = day.grammar

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <Link
        to={paths.day(day.day)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Day {day.day}
      </Link>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Grammar · {day.isReview ? 'review, nothing new' : 'only what today needs'}
        </p>
        <h1 className="font-display text-3xl leading-tight">{day.grammarFocus}</h1>
      </header>
      <SessionTimer minutes={SECTIONS.find((section) => section.id === 'grammar')?.minutes ?? 5} onTick={onTick} />

      {points.map((point, pointIndex) => (
        <PointCard key={point.title} day={day.day} point={point} pointIndex={pointIndex} total={points.length} />
      ))}

      {check && check.length > 0 && <CheckYourself key={day.day} items={check} />}

      <section className="rounded-2xl border border-dashed px-5 py-4">
        <SubHeading>Leave for later</SubHeading>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{notYet}</p>
      </section>

      <SessionActions
        done={done}
        completeLabel="Mark grammar complete"
        doneLabel="Grammar complete"
        onComplete={() => completeSection(day.day, 'grammar')}
        continueTo={paths.section(day.day, 'listen')}
        continueLabel="Continue to listening"
      />
    </main>
  )
}

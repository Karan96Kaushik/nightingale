import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { getDay } from '@/lib/curriculum/plan'
import { paths } from '@/lib/routes'
import { speakSpanish } from '@/lib/speech'
import { useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { SessionTimer } from '@/components/learn/session-timer'

export function PracticeSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds } = useProgress()
  const [speakLeft, setSpeakLeft] = useState(0)
  const [speaking, setSpeaking] = useState(false)

  const onTick = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(dayNumber)) return
      recordSeconds(dayNumber, 'practice', seconds)
    },
    [dayNumber, recordSeconds],
  )

  useEffect(() => {
    if (!speaking || speakLeft <= 0) return
    const id = window.setInterval(() => {
      setSpeakLeft((value) => {
        if (value <= 1) {
          setSpeaking(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [speaking, speakLeft])

  if (!day) {
    return (
      <main className="px-4 py-8">
        <p>No practice for this day.</p>
      </main>
    )
  }

  const speakMinutes = day.practice.speakMinutes
  const startFreeSpeak = () => {
    if (!speakMinutes) return
    setSpeakLeft(speakMinutes * 60)
    setSpeaking(true)
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Speaking · keep going</p>
        <h1 className="font-display text-2xl">{day.practice.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{day.practice.instruction}</p>
      </div>
      <SessionTimer onTick={onTick} />

      <section className="space-y-2 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Say these out loud</h2>
        {day.practice.starters.map((line) => (
          <button
            key={line}
            type="button"
            onClick={() => speakSpanish(line.replace('…', ''))}
            className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left"
          >
            <span className="font-display text-lg">{line}</span>
            <Volume2 className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </section>

      {speakMinutes ? (
        <section className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Free speak — do not stop for mistakes.</p>
          <p className="font-display mt-2 text-3xl tabular-nums">
            {Math.floor(speakLeft / 60)}:{String(speakLeft % 60).padStart(2, '0')}
          </p>
          <Button type="button" className="mt-3" onClick={startFreeSpeak} disabled={speaking}>
            {speaking ? 'Keep speaking' : `Start ${speakMinutes}-minute speak`}
          </Button>
        </section>
      ) : null}

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {day.practice.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>

      <Button type="button" className="mt-auto" onClick={() => completeSection(day.day, 'practice')}>
        Mark speaking complete
      </Button>
      <Button asChild variant="ghost">
        <Link to={paths.home()}>Back to today</Link>
      </Button>
    </main>
  )
}

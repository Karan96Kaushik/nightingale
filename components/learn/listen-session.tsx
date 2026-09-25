import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Volume2 } from 'lucide-react'
import { getDay } from '@/lib/curriculum/plan'
import { paths } from '@/lib/routes'
import { speakSpanish } from '@/lib/speech'
import { useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SessionTimer } from '@/components/learn/session-timer'

type Pass = 'en' | 'es' | 'none'

export function ListenSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds } = useProgress()
  const [pass, setPass] = useState<Pass>('en')

  const onTick = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(dayNumber)) return
      recordSeconds(dayNumber, 'listen', seconds)
    },
    [dayNumber, recordSeconds],
  )

  if (!day) {
    return (
      <main className="px-4 py-8">
        <p>No listening for this day.</p>
      </main>
    )
  }

  const playAll = () => {
    const text = day.dialogue.lines.map((line) => `${line.speaker}. ${line.spanish}`).join('. ')
    speakSpanish(text)
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Listening · 60–80% is enough</p>
        <h1 className="font-display text-2xl">{day.listenFocus}</h1>
      </div>
      <SessionTimer onTick={onTick} />

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg">{day.dialogue.title}</h2>
          <Button type="button" size="sm" variant="outline" onClick={playAll}>
            <Volume2 /> Play
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          1. English subtitles. 2. Spanish subtitles. 3. No subtitles. Do not chase every word.
        </p>
      </div>

      <Tabs value={pass} onValueChange={(value) => setPass(value as Pass)}>
        <TabsList className="w-full">
          <TabsTrigger value="en" className="flex-1">
            English
          </TabsTrigger>
          <TabsTrigger value="es" className="flex-1">
            Spanish
          </TabsTrigger>
          <TabsTrigger value="none" className="flex-1">
            None
          </TabsTrigger>
        </TabsList>
        <TabsContent value={pass} className="mt-3 space-y-3">
          {day.dialogue.lines.map((line, index) => (
            <button
              key={`${line.speaker}-${index}`}
              type="button"
              onClick={() => speakSpanish(line.spanish)}
              className="w-full rounded-lg border bg-card px-3 py-3 text-left"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{line.speaker}</p>
              {(pass === 'es' || pass === 'en') && <p className="font-medium">{line.spanish}</p>}
              {pass === 'en' && <p className="text-sm text-muted-foreground">{line.english}</p>}
              {pass === 'none' && <p className="text-sm text-muted-foreground">Tap to hear this line.</p>}
            </button>
          ))}
        </TabsContent>
      </Tabs>

      {day.extraListen && (
        <a
          href={day.extraListen.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary"
        >
          <ExternalLink className="size-4" />
          {day.extraListen.title}
        </a>
      )}

      <Button type="button" className="mt-auto" onClick={() => completeSection(day.day, 'listen')}>
        Mark listening complete
      </Button>
      <Button asChild variant="ghost">
        <Link to={paths.section(day.day, 'practice')}>Continue to speaking</Link>
      </Button>
    </main>
  )
}

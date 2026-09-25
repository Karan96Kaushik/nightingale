import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Pause, Play, Volume2 } from 'lucide-react'
import {
  dialogueClips,
  pauseDialogue,
  playDialogueLine,
  playDialogueSequence,
  resumeDialogue,
  stopDialogue,
  subscribeDialogue,
  type DialoguePlayback,
} from '@/lib/audio/dialogue-player'
import { getDay } from '@/lib/curriculum/plan'
import { paths } from '@/lib/routes'
import { useDayProgress, useProgress } from '@/hooks/use-progress'
import { Button } from '@/components/ui/button'
import { SessionActions } from '@/components/learn/session-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SessionTimer } from '@/components/learn/session-timer'

type Pass = 'en' | 'es' | 'none'

export function ListenSession() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { completeSection, recordSeconds } = useProgress()
  const done = Boolean(useDayProgress(dayNumber)?.sections.listen.completed)
  const [pass, setPass] = useState<Pass>('en')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [playback, setPlayback] = useState<DialoguePlayback>('idle')
  const clips = day ? dialogueClips(day.day, day.dialogue.lines) : []

  useEffect(() => {
    const unsubscribe = subscribeDialogue(setPlayback)
    return () => {
      unsubscribe()
      stopDialogue()
    }
  }, [])

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

  const onPlaybackClick = () => {
    if (playback === 'playing') {
      pauseDialogue()
      return
    }
    if (playback === 'paused') {
      resumeDialogue()
      return
    }
    void playDialogueSequence(clips, setActiveIndex)
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
          <Button type="button" size="sm" variant="outline" onClick={onPlaybackClick}>
            {playback === 'playing' ? <Pause /> : playback === 'paused' ? <Play /> : <Volume2 />}
            {playback === 'playing' ? 'Pause' : playback === 'paused' ? 'Resume' : 'Play'}
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
              onClick={() => void playDialogueLine(clips[index], setActiveIndex, index)}
              className={`w-full rounded-lg border bg-card px-3 py-3 text-left ${activeIndex === index ? 'border-primary' : ''}`}
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

      <SessionActions
        done={done}
        completeLabel="Mark listening complete"
        doneLabel="Listening complete"
        onComplete={() => completeSection(day.day, 'listen')}
        continueTo={paths.section(day.day, 'practice')}
        continueLabel="Continue to speaking"
      />
    </main>
  )
}

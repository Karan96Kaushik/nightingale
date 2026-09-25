import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export function SessionTimer({
  minutes = 10,
  onTick,
}: {
  minutes?: number
  onTick?: (elapsedSeconds: number) => void
}) {
  const sectionSeconds = minutes * 60
  const [remaining, setRemaining] = useState(sectionSeconds)
  const [running, setRunning] = useState(true)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      onTickRef.current?.(1)
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  const shownMinutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const pct = ((sectionSeconds - remaining) / sectionSeconds) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl tabular-nums">
          {shownMinutes}:{String(seconds).padStart(2, '0')}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause /> : <Play />}
          {running ? 'Pause' : 'Resume'}
        </Button>
      </div>
      <Progress value={pct} />
      <p className="text-xs text-muted-foreground">{minutes}-minute block. Keep going if you finish early.</p>
    </div>
  )
}

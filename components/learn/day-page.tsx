import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getDay } from '@/lib/curriculum/plan'
import { SECTIONS, sectionFocus } from '@/lib/curriculum/types'
import { paths } from '@/lib/routes'
import { useProgress } from '@/hooks/use-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { emptyDayProgress } from '@/lib/progress/types'

export function DayPage() {
  const { day: dayParam } = useParams()
  const dayNumber = Number(dayParam)
  const day = getDay(dayNumber)
  const { progress } = useProgress()

  if (!day) {
    return (
      <main className="px-4 py-8">
        <p>That day is not in the plan.</p>
        <Button asChild variant="link" className="px-0">
          <Link to={paths.plan()}>Back to plan</Link>
        </Button>
      </main>
    )
  }

  const state = progress.days[String(day.day)] ?? emptyDayProgress()

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <Link to={paths.home()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Today
      </Link>
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Day {day.day}</p>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl">{day.title}</h1>
          {day.isReview && <Badge variant="secondary">Review</Badge>}
        </div>
      </header>

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const focus = sectionFocus(day, section.id)
          const done = state.sections[section.id].completed
          return (
            <div key={section.id} className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {section.minutes} min · {done ? 'Done' : 'Not started'}
              </p>
              <h2 className="font-display text-xl">{section.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{focus}</p>
              <Button asChild className="mt-4">
                <Link to={paths.section(day.day, section.id)}>{done ? 'Practice again' : 'Start'}</Link>
              </Button>
            </div>
          )
        })}
      </div>
    </main>
  )
}

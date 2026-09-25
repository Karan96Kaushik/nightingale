import { Link } from 'react-router-dom'
import { PLAN, PLAN_LENGTH } from '@/lib/curriculum/plan'
import { DAILY_MINUTES, SECTIONS } from '@/lib/curriculum/types'
import { paths } from '@/lib/routes'
import { useProgress } from '@/hooks/use-progress'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function PlanPage() {
  const { progress, completedDays } = useProgress()

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="font-display text-3xl">Two-week plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Beginner foundation. {DAILY_MINUTES} minutes a day:{' '}
          {SECTIONS.map((section) => `${section.minutes} ${section.label.toLowerCase()}`).join(', ')}. {completedDays} of{' '}
          {PLAN_LENGTH} days complete.
        </p>
      </header>
      <Progress value={(completedDays / PLAN_LENGTH) * 100} />

      <ol className="space-y-3">
        {PLAN.map((day) => {
          const state = progress.days[String(day.day)]
          const done = Boolean(state?.completedAt)
          const started = Boolean(state)
          return (
            <li key={day.day}>
              <Link to={paths.day(day.day)} className="block rounded-xl border bg-card p-4 hover:bg-muted/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Day {day.day}</p>
                    <h2 className="font-display text-lg">{day.title}</h2>
                  </div>
                  {day.isReview ? (
                    <Badge variant="secondary">Review</Badge>
                  ) : done ? (
                    <Badge>Done</Badge>
                  ) : started ? (
                    <Badge variant="outline">In progress</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{day.vocabFocus}</p>
              </Link>
            </li>
          )
        })}
      </ol>

      <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="font-display text-base text-foreground">After two weeks you should be able to</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Introduce yourself and talk about work, hobbies, and family</li>
          <li>Order food, shop, and give basic directions</li>
          <li>Describe your routine and what you did yesterday</li>
          <li>Understand slow beginner conversations</li>
        </ul>
      </section>
    </main>
  )
}

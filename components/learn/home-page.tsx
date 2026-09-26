import { Link } from 'react-router-dom'
import { BookOpen, Check, Ear, Languages, MessageCircle, Sparkles } from 'lucide-react'
import { PLAN, PLAN_LENGTH } from '@/lib/curriculum/plan'
import { DAILY_MINUTES, SECTIONS, sectionFocus } from '@/lib/curriculum/types'
import { paths } from '@/lib/routes'
import { useProgress } from '@/hooks/use-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { emptyDayProgress } from '@/lib/progress/types'

const SECTION_ICONS = {
  vocab: Sparkles,
  grammar: BookOpen,
  listen: Ear,
  practice: MessageCircle,
}

export function HomePage() {
  const { progress, dayNumber, completedDays, minutesStudied, dueReviews } = useProgress()
  const today = PLAN.find((day) => day.day === dayNumber) ?? PLAN[0]
  const dayState = progress.days[String(today.day)] ?? emptyDayProgress()
  const sectionDone = SECTIONS.filter((section) => dayState.sections[section.id].completed).length
  const nextSection = SECTIONS.find((section) => !dayState.sections[section.id].completed) ?? SECTIONS[0]
  const planPct = (completedDays / PLAN_LENGTH) * 100

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nightingale</p>
        <h1 className="font-display text-3xl">Hoy es el día {today.day}</h1>
        <p className="text-muted-foreground">
          {today.title}. {DAILY_MINUTES} minutes: phrases, one grammar pattern, listening, then speaking.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={`${progress.streak}d`} />
        <Stat label="Days done" value={`${completedDays}/${PLAN_LENGTH}`} />
        <Stat label="Minutes" value={`${minutesStudied}`} />
      </div>

      <Card>
        <CardHeader className="gap-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-xl">Today’s {DAILY_MINUTES} minutes</CardTitle>
            {today.isReview && <Badge variant="secondary">Review</Badge>}
          </div>
          <CardDescription>
            {sectionDone} of {SECTIONS.length} blocks done. {dueReviews.length} phrases are due for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={(sectionDone / SECTIONS.length) * 100} />
          <Button asChild className="w-full">
            <Link to={paths.section(today.day, nextSection.id)}>
              {sectionDone === SECTIONS.length ? 'Revisit today' : `Start ${nextSection.label.toLowerCase()}`}
            </Link>
          </Button>
          <div className="space-y-2">
            {SECTIONS.map((section) => {
              const Icon = SECTION_ICONS[section.id]
              const done = dayState.sections[section.id].completed
              const focus = sectionFocus(today, section.id)
              return (
                <Link
                  key={section.id}
                  to={paths.section(today.day, section.id)}
                  className="flex items-center gap-3 rounded-lg border px-3 py-3 hover:bg-muted/60"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {section.minutes} min — {section.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{focus}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Link
        to={paths.conjugations()}
        className="flex items-center gap-3 rounded-xl border bg-card px-4 py-4 hover:bg-muted/60"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Languages className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">Common verb conjugations</span>
          <span className="block text-xs text-muted-foreground">
            Present forms for ser, estar, tener, ir, and the other verbs that do not follow the regular endings.
          </span>
        </span>
      </Link>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">{PLAN_LENGTH}-day plan</h2>
          <Link to={paths.plan()} className="text-sm text-primary">
            See all
          </Link>
        </div>
        <Progress value={planPct} />
        <div className="grid grid-cols-7 gap-2">
          {PLAN.map((day) => {
            const done = Boolean(progress.days[String(day.day)]?.completedAt)
            const current = day.day === today.day
            return (
              <Link
                key={day.day}
                to={paths.day(day.day)}
                className={`flex h-10 items-center justify-center rounded-md text-sm ${
                  done
                    ? 'bg-primary text-primary-foreground'
                    : current
                      ? 'border border-primary text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {day.day}
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3 text-center">
      <p className="font-display text-xl">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

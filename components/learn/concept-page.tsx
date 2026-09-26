import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, List } from 'lucide-react'
import { CONCEPT_BOOK, getBookPage, writeLastBookPage } from '@/lib/curriculum/concept-book'
import { paths } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConceptProse } from '@/components/learn/concept-prose'
import { ConjugationDrill } from '@/components/learn/conjugation-drill'

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
}

export function ConceptPage() {
  const { pageId } = useParams()
  const navigate = useNavigate()
  const found = getBookPage(pageId)
  const total = CONCEPT_BOOK.pages.length

  useEffect(() => {
    if (!found) return
    writeLastBookPage(found.page.id)
    window.scrollTo({ top: 0 })
  }, [found?.page.id])

  useEffect(() => {
    if (!found) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return
      if (event.key === 'ArrowLeft' && found.previous) navigate(paths.conceptPage(found.previous.id))
      if (event.key === 'ArrowRight' && found.next) navigate(paths.conceptPage(found.next.id))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [found, navigate])

  if (!found) {
    return (
      <main className="px-5 py-8">
        <p>That page is not in the book.</p>
        <Button asChild variant="link" className="px-0">
          <Link to={paths.concepts()}>Back to contents</Link>
        </Button>
      </main>
    )
  }

  const { page, index, previous, next } = found

  return (
    <main className="flex flex-1 flex-col px-5 py-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link to={paths.concepts()} className="inline-flex items-center gap-1.5 hover:text-foreground">
          <List className="size-4" /> Contents
        </Link>
        <span className="tabular-nums">
          {index + 1} / {total}
        </span>
      </div>

      <article className="mt-10 flex flex-col gap-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {page.chapter.label} · {page.chapter.title}
          </p>
          <h1 className="font-display text-3xl leading-tight">
            {page.number && <span className="mr-2 text-primary">{page.number}</span>}
            {page.title}
          </h1>
          <div aria-hidden className="h-px w-12 bg-primary/60" />
        </header>

        <ConceptProse blocks={page.blocks} dropCap={page.kind === 'reading'} />

        {page.kind === 'drill' && <ConjugationDrill key={page.id} group={page.group} />}
      </article>

      <footer className="mt-auto space-y-4 pt-12">
        <div className="h-0.5 overflow-hidden rounded-full bg-border" aria-hidden>
          <div className="h-full bg-primary/70" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PagerLink
            to={previous ? paths.conceptPage(previous.id) : paths.concepts()}
            direction="previous"
            label={previous ? 'Previous' : 'Contents'}
            title={previous ? previous.title : 'All chapters'}
          />
          <PagerLink
            to={next ? paths.conceptPage(next.id) : paths.concepts()}
            direction="next"
            label={next ? 'Next' : 'The end'}
            title={next ? next.title : 'Back to contents'}
          />
        </div>
      </footer>
    </main>
  )
}

function PagerLink({
  to,
  direction,
  label,
  title,
}: {
  to: string
  direction: 'previous' | 'next'
  label: string
  title: string
}) {
  const isNext = direction === 'next'
  return (
    <Link
      to={to}
      rel={isNext ? 'next' : 'prev'}
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-xl border bg-card px-4 py-3 hover:bg-muted/60',
        isNext && 'items-end text-right',
      )}
    >
      <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
        {!isNext && <ArrowLeft className="size-3.5" />}
        {label}
        {isNext && <ArrowRight className="size-3.5" />}
      </span>
      <span className="w-full truncate font-display text-sm">{title}</span>
    </Link>
  )
}

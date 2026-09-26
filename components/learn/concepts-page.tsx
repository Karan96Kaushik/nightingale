import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { CONCEPT_BOOK, chapterPages, readLastBookPage } from '@/lib/curriculum/concept-book'
import { paths } from '@/lib/routes'
import { Button } from '@/components/ui/button'

export function ConceptsPage() {
  const [lastPage] = useState(readLastBookPage)
  const firstPage = CONCEPT_BOOK.pages[0]
  const pageNumber = (id: string) => CONCEPT_BOOK.pages.findIndex((page) => page.id === id) + 1

  return (
    <main className="flex flex-1 flex-col gap-8 px-5 py-8">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Nightingale reference</p>
        <h1 className="font-display text-4xl">Concepts</h1>
        <div aria-hidden className="mx-auto h-px w-16 bg-primary/60" />
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
          Verb drills and the grammar behind the daily lessons. One topic per page, read in order or jump to any
          chapter.
        </p>
      </header>

      <Button asChild size="lg" className="w-full">
        <Link to={paths.conceptPage((lastPage ?? firstPage).id)}>
          <BookOpen />
          {lastPage ? `Continue: ${lastPage.number ? `${lastPage.number} ` : ''}${lastPage.title}` : 'Start reading'}
        </Link>
      </Button>

      <nav aria-label="Contents" className="space-y-7">
        <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Contents</h2>
        {CONCEPT_BOOK.chapters.map((chapter) => (
          <section key={chapter.id} className="space-y-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">{chapter.label}</p>
              <h3 className="font-display text-xl">{chapter.title}</h3>
            </div>
            <ol className="space-y-0.5">
              {chapterPages(chapter.id).map((page) => (
                <li key={page.id}>
                  <Link
                    to={paths.conceptPage(page.id)}
                    className="group flex items-baseline gap-2 rounded-md py-1.5 text-sm hover:text-primary"
                  >
                    {page.number && <span className="w-7 shrink-0 text-muted-foreground">{page.number}</span>}
                    <span className="min-w-0">{page.title}</span>
                    <span aria-hidden className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border" />
                    <span className="shrink-0 tabular-nums text-muted-foreground group-hover:text-primary">
                      {pageNumber(page.id)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </nav>
    </main>
  )
}

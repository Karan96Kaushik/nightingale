import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { CONCEPT_GUIDE, type ConceptBlock } from '@/lib/curriculum/concepts'
import { paths } from '@/lib/routes'
import { ConjugationDrill } from '@/components/learn/conjugation-drill'

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

function renderInline(text: string): ReactNode {
  return text.split(INLINE).map((piece, index) => {
    if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {renderInline(piece.slice(2, -2))}
        </strong>
      )
    }
    if (piece.startsWith('*') && piece.endsWith('*') && piece.length > 2) {
      return <em key={index}>{piece.slice(1, -1)}</em>
    }
    if (piece.startsWith('`') && piece.endsWith('`') && piece.length > 2) {
      return (
        <code key={index} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
          {piece.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={index}>{piece}</Fragment>
  })
}

function Blocks({ blocks }: { blocks: ConceptBlock[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') return <p key={index}>{renderInline(block.text)}</p>
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={index} className={`space-y-1 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </List>
          )
        }
        return (
          <div key={index} className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  {block.header.map((cell, cellIndex) => (
                    <th key={cellIndex} className="px-3 py-2 font-medium">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 align-top">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

export function ConceptsPage() {
  const { intro, parts } = CONCEPT_GUIDE

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <Link
        to={paths.home()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Today
      </Link>
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Separate from the daily plan</p>
        <h1 className="font-display text-3xl">Concepts</h1>
        <p className="text-sm text-muted-foreground">
          Verb conjugations to drill, then a beginner to intermediate grammar reference. Tap a topic to open it.
        </p>
      </header>

      <nav aria-label="Concepts" className="flex flex-wrap gap-2">
        <a href="#conjugations" className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted/60">
          Conjugations
        </a>
        {parts.map((part) => (
          <a
            key={part.id}
            href={`#${part.id}`}
            className="rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted/60"
          >
            {part.title.replace(/^Part \d+:\s*/, '')}
          </a>
        ))}
      </nav>

      <ConjugationDrill />

      {intro.length > 0 && <Blocks blocks={intro} />}

      {parts.map((part) => (
        <section key={part.id} id={part.id} className="scroll-mt-4 space-y-3">
          <h2 className="font-display text-2xl">{part.title}</h2>
          {part.blocks.length > 0 && <Blocks blocks={part.blocks} />}
          {part.sections.map((section) => (
            <details key={section.id} className="group rounded-xl border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-lg">{section.title}</h3>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t px-4 py-4">
                <Blocks blocks={section.blocks} />
              </div>
            </details>
          ))}
        </section>
      ))}
    </main>
  )
}

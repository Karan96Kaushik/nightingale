import { Fragment, type ReactNode } from 'react'
import type { ConceptBlock } from '@/lib/curriculum/concepts'
import { cn } from '@/lib/utils'

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
const LEAD_IN = /^\*\*[^*]+\*\*$/

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
      return (
        <em key={index} className="text-foreground">
          {piece.slice(1, -1)}
        </em>
      )
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

export function ConceptProse({ blocks, dropCap = false }: { blocks: ConceptBlock[]; dropCap?: boolean }) {
  return (
    <div className="space-y-5 text-[15px] leading-7 text-foreground/80">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          if (LEAD_IN.test(block.text)) {
            return (
              <h3 key={index} className="pt-2 font-display text-lg leading-snug text-foreground">
                {block.text.slice(2, -2)}
              </h3>
            )
          }
          const withDropCap = dropCap && index === 0 && block.text.length > 120
          return (
            <p
              key={index}
              className={cn(
                withDropCap &&
                  'first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-primary',
              )}
            >
              {renderInline(block.text)}
            </p>
          )
        }

        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List
              key={index}
              className={cn('space-y-2 pl-5 marker:text-primary/70', block.ordered ? 'list-decimal' : 'list-disc')}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </List>
          )
        }

        return (
          <div key={index} className="-mx-1 overflow-x-auto px-1">
            <table className="w-full border-y border-border text-left text-sm leading-6">
              <thead>
                <tr>
                  {block.header.map((cell, cellIndex) => (
                    <th
                      key={cellIndex}
                      className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-border/60">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className={cn('px-2 py-2 align-top', cellIndex === 0 && 'text-foreground')}>
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

import { CONCEPT_GUIDE, type ConceptBlock } from './concepts'
import { CONJUGATION_GROUPS, type ConjugationGroup } from './conjugations'

export type BookChapter = {
  id: string
  label: string
  title: string
}

type PageBase = {
  id: string
  chapter: BookChapter
  number?: string
  title: string
}

export type BookPage =
  | (PageBase & { kind: 'reading'; blocks: ConceptBlock[] })
  | (PageBase & { kind: 'drill'; group: ConjugationGroup; blocks: ConceptBlock[] })

const LAST_PAGE_KEY = 'nightingale_concepts_last_page'

function splitNumber(title: string) {
  const match = title.match(/^(\d+(?:\.\d+)*)\s+(.*)$/)
  return match ? { number: match[1], title: match[2] } : { title }
}

function buildBook() {
  const drills: BookChapter = { id: 'verb-drills', label: 'Drills', title: 'Verb conjugations' }
  const chapters: BookChapter[] = [drills]
  const pages: BookPage[] = CONJUGATION_GROUPS.map((group) => ({
    id: `verbs-${group.id}`,
    chapter: drills,
    kind: 'drill',
    title: group.title,
    group,
    blocks: [
      { type: 'paragraph', text: group.description },
      {
        type: 'paragraph',
        text: 'Five present forms each: **yo**, **tú**, **él / ella**, **nosotros**, and **ellos / ellas**. Tap a form to hear it, or cover them all and test yourself.',
      },
    ],
  }))

  for (const part of CONCEPT_GUIDE.parts) {
    const match = part.title.match(/^(Part \d+):\s*(.*)$/)
    const chapter: BookChapter = match
      ? { id: part.id, label: match[1], title: match[2] }
      : { id: part.id, label: 'Afterword', title: part.title }
    chapters.push(chapter)

    if (part.blocks.length > 0) {
      pages.push({ id: part.id, chapter, kind: 'reading', title: chapter.title, blocks: part.blocks })
    }
    for (const section of part.sections) {
      pages.push({ id: section.id, chapter, kind: 'reading', ...splitNumber(section.title), blocks: section.blocks })
    }
  }

  return { chapters, pages }
}

export const CONCEPT_BOOK = buildBook()

export function getBookPage(id: string | undefined) {
  const index = CONCEPT_BOOK.pages.findIndex((page) => page.id === id)
  if (index === -1) return null
  return {
    page: CONCEPT_BOOK.pages[index],
    index,
    previous: CONCEPT_BOOK.pages[index - 1] ?? null,
    next: CONCEPT_BOOK.pages[index + 1] ?? null,
  }
}

export function chapterPages(chapterId: string) {
  return CONCEPT_BOOK.pages.filter((page) => page.chapter.id === chapterId)
}

export function readLastBookPage(): BookPage | null {
  try {
    return getBookPage(localStorage.getItem(LAST_PAGE_KEY) ?? undefined)?.page ?? null
  } catch {
    return null
  }
}

export function writeLastBookPage(id: string) {
  try {
    localStorage.setItem(LAST_PAGE_KEY, id)
  } catch {
    // Storage can be blocked; reading still works, it just won't resume.
  }
}

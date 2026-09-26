import source from '../../spanish_concepts.md?raw'

export type ConceptBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }

export type ConceptSection = {
  id: string
  title: string
  blocks: ConceptBlock[]
}

export type ConceptPart = {
  id: string
  title: string
  blocks: ConceptBlock[]
  sections: ConceptSection[]
}

export type ConceptGuide = {
  title: string
  intro: ConceptBlock[]
  parts: ConceptPart[]
}

const LIST_ITEM = /^(-|\d+\.)\s+/

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableDivider(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(line.trim())
}

function parseBlocks(lines: string[]): ConceptBlock[] {
  const blocks: ConceptBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()

    if (!line || line === '---') {
      index += 1
      continue
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        tableLines.push(lines[index])
        index += 1
      }
      const [header = '', ...rest] = tableLines
      blocks.push({
        type: 'table',
        header: tableCells(header),
        rows: rest.filter((row) => !isTableDivider(row)).map(tableCells),
      })
      continue
    }

    const listMatch = line.match(LIST_ITEM)
    if (listMatch) {
      const ordered = listMatch[1] !== '-'
      const items: string[] = []
      while (index < lines.length) {
        const item = lines[index].trim().match(LIST_ITEM)
        if (!item || (item[1] !== '-') !== ordered) break
        items.push(lines[index].trim().slice(item[0].length))
        index += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraph: string[] = []
    while (index < lines.length) {
      const next = lines[index].trim()
      if (!next || next === '---' || next.startsWith('|') || LIST_ITEM.test(next)) break
      paragraph.push(next)
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
  }

  return blocks
}

export function parseConceptGuide(markdown: string): ConceptGuide {
  let title = ''
  const intro: string[] = []
  const parts: { title: string; lines: string[]; sections: { title: string; lines: string[] }[] }[] = []

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim()
    } else if (line.startsWith('## ')) {
      parts.push({ title: line.slice(3).trim(), lines: [], sections: [] })
    } else if (line.startsWith('### ')) {
      const part = parts.at(-1)
      if (part) part.sections.push({ title: line.slice(4).trim(), lines: [] })
    } else {
      const part = parts.at(-1)
      const section = part?.sections.at(-1)
      if (section) section.lines.push(line)
      else if (part) part.lines.push(line)
      else intro.push(line)
    }
  }

  return {
    title,
    intro: parseBlocks(intro),
    parts: parts.map((part) => ({
      id: slug(part.title),
      title: part.title,
      blocks: parseBlocks(part.lines),
      sections: part.sections.map((section) => ({
        id: slug(section.title),
        title: section.title,
        blocks: parseBlocks(section.lines),
      })),
    })),
  }
}

export const CONCEPT_GUIDE = parseConceptGuide(source)

export type SectionId = 'vocab' | 'grammar' | 'listen' | 'practice'

export type Phrase = {
  id: string
  spanish: string
  english: string
  note?: string
}

export type DialogueLine = {
  speaker: string
  spanish: string
  english: string
}

export type PracticePrompt = {
  title: string
  instruction: string
  starters: string[]
  tips: string[]
  speakMinutes?: number
}

export type GrammarExample = {
  spanish: string
  english: string
}

export type GrammarPoint = {
  title: string
  rule: string
  examples: GrammarExample[]
}

export type DayGrammar = {
  points: GrammarPoint[]
  notYet: string
}

export type DayPlan = {
  day: number
  title: string
  isReview: boolean
  vocabFocus: string
  grammarFocus: string
  listenFocus: string
  practiceFocus: string
  grammar: DayGrammar
  phrases: Phrase[]
  dialogue: {
    title: string
    lines: DialogueLine[]
  }
  extraListen?: {
    title: string
    url: string
  }
  practice: PracticePrompt
}

export const SECTIONS: { id: SectionId; label: string; minutes: number }[] = [
  { id: 'vocab', label: 'Vocabulary', minutes: 10 },
  { id: 'grammar', label: 'Grammar', minutes: 5 },
  { id: 'listen', label: 'Listening', minutes: 10 },
  { id: 'practice', label: 'Speaking', minutes: 10 },
]

export const DAILY_MINUTES = SECTIONS.reduce((sum, section) => sum + section.minutes, 0)

export function sectionFocus(day: DayPlan, section: SectionId): string {
  switch (section) {
    case 'vocab':
      return day.vocabFocus
    case 'grammar':
      return day.grammarFocus
    case 'listen':
      return day.listenFocus
    case 'practice':
      return day.practiceFocus
  }
}

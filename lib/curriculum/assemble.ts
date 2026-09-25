import type { DayPlan, DialogueLine, GrammarPoint, Phrase, PracticePrompt } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isPhrase(value: unknown): value is Phrase {
  if (!isRecord(value) || !isString(value.id) || !isString(value.spanish) || !isString(value.english)) return false
  return value.note === undefined || isString(value.note)
}

function isDialogueLine(value: unknown): value is DialogueLine {
  return isRecord(value) && isString(value.speaker) && isString(value.spanish) && isString(value.english)
}

function isGrammarPoint(value: unknown): value is GrammarPoint {
  if (!isRecord(value) || !isString(value.title) || !isString(value.rule) || !Array.isArray(value.examples)) return false
  return value.examples.every((example) => isRecord(example) && isString(example.spanish) && isString(example.english))
}

function isPractice(value: unknown): value is PracticePrompt {
  if (!isRecord(value) || !isString(value.title) || !isString(value.instruction)) return false
  if (!Array.isArray(value.starters) || !value.starters.every(isString)) return false
  if (!Array.isArray(value.tips) || !value.tips.every(isString)) return false
  return value.speakMinutes === undefined || typeof value.speakMinutes === 'number'
}

export function isDayPlan(value: unknown): value is DayPlan {
  if (!isRecord(value)) return false
  if (typeof value.day !== 'number' || !Number.isInteger(value.day) || value.day < 1) return false
  if (!isString(value.title) || typeof value.isReview !== 'boolean') return false
  if (!isString(value.vocabFocus) || !isString(value.grammarFocus) || !isString(value.listenFocus) || !isString(value.practiceFocus)) {
    return false
  }
  if (!isRecord(value.grammar) || !isString(value.grammar.notYet) || !Array.isArray(value.grammar.points)) return false
  if (!value.grammar.points.every(isGrammarPoint)) return false
  if (!Array.isArray(value.phrases) || !value.phrases.every(isPhrase)) return false
  if (!isRecord(value.dialogue) || !isString(value.dialogue.title) || !Array.isArray(value.dialogue.lines)) return false
  if (!value.dialogue.lines.every(isDialogueLine)) return false
  if (value.extraListen !== undefined) {
    if (!isRecord(value.extraListen) || !isString(value.extraListen.title) || !isString(value.extraListen.url)) return false
  }
  return isPractice(value.practice)
}

export function assemblePlan(sources: { source: string; value: unknown }[], builtin: DayPlan[]): DayPlan[] {
  const byDay = new Map<number, DayPlan>()
  for (const day of builtin) byDay.set(day.day, day)

  const seenJson = new Map<number, string>()
  for (const entry of sources) {
    if (!isDayPlan(entry.value)) {
      throw new Error(`Invalid Spanish day plan: ${entry.source}`)
    }
    const previous = seenJson.get(entry.value.day)
    if (previous) {
      throw new Error(`Day ${entry.value.day} is defined in both ${previous} and ${entry.source}`)
    }
    seenJson.set(entry.value.day, entry.source)
    byDay.set(entry.value.day, entry.value)
  }

  return [...byDay.values()].sort((a, b) => a.day - b.day)
}

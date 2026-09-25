import { assemblePlan } from './assemble'
import { BUILTIN_DAYS } from './builtin-days'
import { JSON_DAY_FILES } from './json-days'
import type { DayPlan } from './types'

export const PLAN: DayPlan[] = assemblePlan(JSON_DAY_FILES, BUILTIN_DAYS)

export const PLAN_LENGTH = PLAN.length

export function getDay(day: number): DayPlan | undefined {
  return PLAN.find((item) => item.day === day)
}

export function getAllPhrases() {
  return PLAN.flatMap((day) => day.phrases.map((phrase, index) => ({ ...phrase, day: day.day, index })))
}

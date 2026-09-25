import { PLAN_LENGTH } from '@/lib/curriculum/plan'
import { SECTIONS, type SectionId } from '@/lib/curriculum/types'
import { createEmptyProgress, emptyDayProgress, EMPTY_SECTION, type DayProgress, type ProgressState } from './types'

export const PROGRESS_KEY = 'nightingale_progress'

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function isYesterday(isoDate: string, now = new Date()) {
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return isoDate === todayKey(yesterday)
}

function normalizeDay(day: DayProgress | undefined): DayProgress {
  const empty = emptyDayProgress()
  if (!day?.sections) return empty
  const sections = { ...empty.sections }
  for (const section of SECTIONS) {
    const saved = day.sections[section.id]
    if (saved) sections[section.id] = { ...EMPTY_SECTION, ...saved }
  }
  return { ...day, sections }
}

export function readProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return createEmptyProgress()
    const parsed = JSON.parse(raw) as ProgressState
    const days: ProgressState['days'] = {}
    for (const [key, day] of Object.entries(parsed.days ?? {})) {
      days[key] = normalizeDay(day)
    }
    return {
      ...createEmptyProgress(),
      ...parsed,
      days,
      reviews: parsed.reviews ?? {},
    }
  } catch {
    return createEmptyProgress()
  }
}

export function writeProgress(state: ProgressState) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state))
}

export function touchStreak(state: ProgressState, now = new Date()): ProgressState {
  const today = todayKey(now)
  if (state.lastStudyDate === today) return state
  const nextStreak = state.lastStudyDate && isYesterday(state.lastStudyDate, now) ? state.streak + 1 : 1
  return {
    ...state,
    lastStudyDate: today,
    streak: nextStreak,
    startedAt: state.startedAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export function addSeconds(
  state: ProgressState,
  day: number,
  section: SectionId,
  seconds: number,
  now = new Date(),
): ProgressState {
  const key = String(day)
  const dayState = normalizeDay(state.days[key])
  const sectionState = dayState.sections[section]
  return {
    ...touchStreak(state, now),
    days: {
      ...state.days,
      [key]: {
        ...dayState,
        sections: {
          ...dayState.sections,
          [section]: {
            ...sectionState,
            secondsSpent: sectionState.secondsSpent + seconds,
          },
        },
      },
    },
    updatedAt: now.toISOString(),
  }
}

export function completeSection(state: ProgressState, day: number, section: SectionId, now = new Date()): ProgressState {
  const key = String(day)
  const dayState = normalizeDay(state.days[key])
  const sections = {
    ...dayState.sections,
    [section]: {
      ...dayState.sections[section],
      completed: true,
      completedAt: now.toISOString(),
    },
  }
  const allDone = SECTIONS.every((item) => sections[item.id].completed)
  return {
    ...touchStreak(state, now),
    days: {
      ...state.days,
      [key]: {
        sections,
        completedAt: allDone ? now.toISOString() : dayState.completedAt,
      },
    },
    updatedAt: now.toISOString(),
  }
}

export function currentDay(state: ProgressState) {
  for (let day = 1; day <= PLAN_LENGTH; day += 1) {
    if (!state.days[String(day)]?.completedAt) return day
  }
  return PLAN_LENGTH
}

export function completedDayCount(state: ProgressState) {
  return Object.values(state.days).filter((day) => Boolean(day.completedAt)).length
}

export function totalMinutes(state: ProgressState) {
  return Math.round(
    Object.values(state.days).reduce((sum, day) => {
      const normalized = normalizeDay(day)
      return sum + SECTIONS.reduce((sectionSum, section) => sectionSum + normalized.sections[section.id].secondsSpent, 0)
    }, 0) / 60,
  )
}

export function resetProgress() {
  const empty = createEmptyProgress()
  empty.updatedAt = new Date().toISOString()
  writeProgress(empty)
  return empty
}

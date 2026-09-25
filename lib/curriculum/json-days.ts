// Every plan.json under spanish/ is a day. Add spanish/day-2/plan.json and the app picks it up.
const modules = import.meta.glob('../../spanish/**/plan.json', {
  eager: true,
  import: 'default',
})

export const JSON_DAY_FILES: { source: string; value: unknown }[] = Object.entries(modules).map(([source, value]) => ({
  source,
  value,
}))

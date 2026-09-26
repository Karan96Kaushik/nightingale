import type { SectionId } from '@/lib/curriculum/types'

export const paths = {
  home: () => '/',
  login: () => '/login',
  plan: () => '/plan',
  review: () => '/review',
  concepts: () => '/concepts',
  conceptPage: (pageId: string) => `/concepts/${pageId}`,
  settings: () => '/settings',
  day: (day: number) => `/learn/${day}`,
  section: (day: number, section: SectionId) => `/learn/${day}/${section}`,
}

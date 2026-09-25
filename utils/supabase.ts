import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export function normalizeSupabaseUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) return ''

  try {
    const parsed = new URL(value)
    const stripped = parsed.pathname
      .replace(/\/+$/, '')
      .replace(/\/(rest|auth|storage|functions|realtime)\/v1$/i, '')
      .replace(/\/+$/, '')

    parsed.pathname = stripped || '/'
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return value.replace(/\/+$/, '').replace(/\/(rest|auth|storage|functions|realtime)\/v1$/i, '')
  }
}

export const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
export const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey)
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'sb_publishable_placeholder',
  {
    auth: {
      persistSession: isSupabaseConfigured(),
      autoRefreshToken: isSupabaseConfigured(),
      detectSessionInUrl: isSupabaseConfigured(),
      storageKey: 'nightingale_supabase_auth',
    },
  },
)

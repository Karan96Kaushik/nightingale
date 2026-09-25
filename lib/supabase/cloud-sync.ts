import { readSettings, writeSettings, type AppSettings } from '@/lib/settings'
import { readProgress, writeProgress } from '@/lib/progress/storage'
import type { ProgressState } from '@/lib/progress/types'
import { supabase, isSupabaseConfigured } from '@/utils/supabase'

export async function pullAndMergeCloud(userId: string) {
  if (!isSupabaseConfigured()) return

  const [settingsRes, progressRes] = await Promise.all([
    supabase.from('user_settings').select('settings, updated_at').eq('user_id', userId).maybeSingle(),
    supabase.from('user_progress').select('state, updated_at').eq('user_id', userId).maybeSingle(),
  ])

  if (settingsRes.error) throw settingsRes.error
  if (progressRes.error) throw progressRes.error

  if (settingsRes.data?.settings && typeof settingsRes.data.settings === 'object') {
    writeSettings({
      ...readSettings(),
      ...(settingsRes.data.settings as Partial<AppSettings>),
    })
  }

  if (progressRes.data?.state && typeof progressRes.data.state === 'object') {
    const remote = progressRes.data.state as ProgressState
    const local = readProgress()
    const remoteTime = new Date(remote.updatedAt ?? progressRes.data.updated_at).getTime()
    const localTime = new Date(local.updatedAt).getTime()
    if (remoteTime >= localTime) {
      writeProgress({ ...local, ...remote })
    }
  }
}

export async function pushSettings(userId: string, settings: AppSettings) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    settings,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function pushProgress(userId: string, state: ProgressState) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    state,
    updated_at: state.updatedAt,
  })
  if (error) throw error
}

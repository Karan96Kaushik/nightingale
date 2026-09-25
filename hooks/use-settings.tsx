import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applySettings, readSettings, writeSettings, type AppSettings, type FontSizeKey, type ThemeMode } from '@/lib/settings'
import { useAuth } from '@/hooks/use-auth'
import { pushSettings } from '@/lib/supabase/cloud-sync'

type SettingsContextValue = {
  settings: AppSettings
  setFontSize: (size: FontSizeKey) => void
  setTheme: (theme: ThemeMode) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, isSyncing } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(() => readSettings())

  useEffect(() => {
    if (!isSyncing) setSettings(readSettings())
  }, [user?.id, isSyncing])

  useEffect(() => {
    applySettings(settings)
    writeSettings(settings)
    if (user) {
      pushSettings(user.id, settings).catch((err) => {
        console.error('Settings sync failed:', err)
      })
    }
  }, [settings, user])

  const setFontSize = useCallback((fontSize: FontSizeKey) => {
    setSettings((prev) => ({ ...prev, fontSize }))
  }, [])

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ fontSize: 'md', theme: 'system' })
  }, [])

  const value = useMemo(
    () => ({ settings, setFontSize, setTheme, resetSettings }),
    [settings, setFontSize, setTheme, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

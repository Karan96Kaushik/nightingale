export type FontSizeKey = 'sm' | 'md' | 'lg' | 'xl'
export type ThemeMode = 'system' | 'light' | 'dark'

export type AppSettings = {
  fontSize: FontSizeKey
  theme: ThemeMode
}

export const STORAGE_KEY = 'nightingale_settings'

export const FONT_SIZES: Record<FontSizeKey, { label: string; scale: number }> = {
  sm: { label: 'Small', scale: 0.875 },
  md: { label: 'Medium', scale: 1 },
  lg: { label: 'Large', scale: 1.125 },
  xl: { label: 'Extra large', scale: 1.25 },
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'md',
  theme: 'system',
}

export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      fontSize: parsed.fontSize && parsed.fontSize in FONT_SIZES ? parsed.fontSize : 'md',
      theme: parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system' ? parsed.theme : 'system',
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function writeSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function applySettings(settings: AppSettings) {
  document.documentElement.style.setProperty('--app-font-scale', String(FONT_SIZES[settings.fontSize].scale))
}

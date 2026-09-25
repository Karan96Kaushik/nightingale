import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useProgress } from '@/hooks/use-progress'
import { useSettings } from '@/hooks/use-settings'
import { FONT_SIZES, type FontSizeKey, type ThemeMode } from '@/lib/settings'
import { paths } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dusk' },
]

export function SettingsPage() {
  const { settings, setFontSize, setTheme } = useSettings()
  const { user, isAuthenticated, isSupabaseEnabled, logout, isSyncing } = useAuth()
  const { resetProgress, minutesStudied, completedDays } = useProgress()

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Local-first. Sign in only if you want progress on another device.</p>
      </header>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-medium">Appearance</h2>
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <Button
                key={theme.id}
                type="button"
                variant={settings.theme === theme.id ? 'default' : 'outline'}
                onClick={() => setTheme(theme.id)}
              >
                {theme.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Text size</Label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((size) => (
              <Button
                key={size}
                type="button"
                variant={settings.fontSize === size ? 'default' : 'outline'}
                onClick={() => setFontSize(size)}
              >
                {FONT_SIZES[size].label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-medium">Account</h2>
        {isAuthenticated ? (
          <>
            <p className="text-sm text-muted-foreground">
              Signed in as {user?.email}
              {isSyncing ? ' · syncing…' : ''}
            </p>
            <Button type="button" variant="outline" onClick={() => logout()}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {isSupabaseEnabled
                ? 'You are using this device only. Sign in to sync progress.'
                : 'Supabase is not configured. Progress stays on this device.'}
            </p>
            {isSupabaseEnabled && (
              <Button asChild>
                <Link to={paths.login()}>Sign in</Link>
              </Button>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-medium">Progress</h2>
        <p className="text-sm text-muted-foreground">
          {completedDays} days complete · {minutesStudied} minutes logged on this device.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (window.confirm('Reset local study progress? This cannot be undone on this device.')) {
              resetProgress()
            }
          }}
        >
          Reset progress
        </Button>
      </section>
    </main>
  )
}

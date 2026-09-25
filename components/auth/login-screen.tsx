import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud, KeyRound, Loader2, LogIn, Mail, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { DAILY_MINUTES } from '@/lib/curriculum/types'
import { paths } from '@/lib/routes'
import { clearLoginSkipped, markLoginSkipped } from '@/lib/auth/login-skip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export { hasSkippedLogin, markLoginSkipped, clearLoginSkipped } from '@/lib/auth/login-skip'

type AuthMode = 'login' | 'register' | 'forgot' | 'update'

export function LoginScreen() {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isSupabaseEnabled,
    isPasswordRecovery,
    isLoading,
    login,
    register,
    requestPasswordReset,
    updatePassword,
    clearError,
    error,
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  useEffect(() => {
    clearLoginSkipped()
  }, [])

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('update')
      setLocalError(null)
      setInfoMessage('Choose a new password for your account.')
    }
  }, [isPasswordRecovery])

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPasswordRecovery && mode !== 'update') {
      clearLoginSkipped()
      navigate(paths.home(), { replace: true })
    }
  }, [isAuthenticated, isLoading, isPasswordRecovery, mode, navigate])

  const continueLocal = () => {
    markLoginSkipped()
    navigate(paths.home(), { replace: true })
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setLocalError(null)
    setInfoMessage(null)
    clearError()
    setPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setLocalError(null)
    setInfoMessage(null)
    clearError()

    try {
      if (mode === 'forgot') {
        await requestPasswordReset(email)
        setInfoMessage('Check your email for a password reset link.')
        return
      }
      if (mode === 'update') {
        if (password !== confirmPassword) throw new Error('Passwords do not match')
        await updatePassword(password)
        clearLoginSkipped()
        navigate(paths.home(), { replace: true })
        return
      }
      if (mode === 'login') await login(email, password)
      else await register(email, password)
      clearLoginSkipped()
      navigate(paths.home(), { replace: true })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  const displayError = localError ?? error

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  const showPasswordFields = mode === 'login' || mode === 'register' || mode === 'update'
  const showEmailField = mode !== 'update'
  const title =
    mode === 'forgot'
      ? 'Reset password'
      : mode === 'update'
        ? 'Set new password'
        : mode === 'register'
          ? 'Create account'
          : 'Sign in'

  return (
    <div className="dusk-wash relative min-h-dvh overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Language learning</p>
          <h1 className="font-display text-4xl">Nightingale</h1>
          <p className="mt-2 text-sm text-muted-foreground">Spanish in {DAILY_MINUTES} minutes a day. Optional cloud sync.</p>
        </div>

        <div className="space-y-5 rounded-xl border bg-card/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Cloud className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mode === 'forgot'
                ? 'Enter your account email and we will send a reset link via Supabase Auth.'
                : mode === 'update'
                  ? 'You opened a password recovery link. Set a new password to finish signing in.'
                  : isSupabaseEnabled
                    ? 'Sign in to keep your 14-day progress in sync. You can keep using the app locally without an account.'
                    : 'Cloud sync is not configured. Continue locally — data stays on this device.'}
            </p>
          </div>

          {isSupabaseEnabled ? (
            <>
              {mode !== 'forgot' && mode !== 'update' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={cn(
                      'h-10 flex-1 rounded-lg border text-sm',
                      mode === 'login' ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground',
                    )}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={cn(
                      'h-10 flex-1 rounded-lg border text-sm',
                      mode === 'register' ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground',
                    )}
                  >
                    Register
                  </button>
                </div>
              )}

              {(mode === 'forgot' || mode === 'update') && (
                <p className="text-sm font-medium text-primary">{title}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {showEmailField && (
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                )}

                {showPasswordFields && (
                  <div className="space-y-1">
                    <Label htmlFor="password">{mode === 'update' ? 'New password' : 'Password'}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                )}

                {mode === 'update' && (
                  <div className="space-y-1">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                )}

                {displayError && <p className="text-sm text-destructive">{displayError}</p>}
                {infoMessage && <p className="text-sm text-primary">{infoMessage}</p>}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <Loader2 className="animate-spin" />
                  ) : mode === 'forgot' ? (
                    <>
                      <Mail /> Send reset link
                    </>
                  ) : mode === 'update' ? (
                    <>
                      <KeyRound /> Update password
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn /> Sign in
                    </>
                  ) : (
                    <>
                      <UserPlus /> Create account
                    </>
                  )}
                </Button>
              </form>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="w-full text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </button>
              )}

              {(mode === 'forgot' || (mode === 'update' && !isPasswordRecovery)) && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full text-xs text-muted-foreground hover:text-primary"
                >
                  Back to sign in
                </button>
              )}
            </>
          ) : null}

          {mode !== 'update' && (
            <Button type="button" variant="outline" className="w-full" onClick={continueLocal}>
              Continue without signing in
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

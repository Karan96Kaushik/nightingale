import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/utils/supabase'
import { pullAndMergeCloud } from '@/lib/supabase/cloud-sync'
import { paths } from '@/lib/routes'

export type AuthUser = {
  id: string
  email: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isSupabaseEnabled: boolean
  isPasswordRecovery: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  logout: () => Promise<void>
  syncNow: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function formatAuthError(err: { message?: string } | Error | null): string {
  const message = err instanceof Error ? err.message : (err?.message ?? 'Authentication failed')
  if (/PGRST125|Invalid path/i.test(message)) {
    return 'Invalid Supabase URL. Use the project URL only (https://xxxx.supabase.co), not .../rest/v1.'
  }
  return message
}

function userFromSession(session: Session): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function init() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setIsLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session) {
        setUser(userFromSession(data.session))
        setToken(data.session.access_token)
        setIsSyncing(true)
        try {
          await pullAndMergeCloud(data.session.user.id)
        } catch (err) {
          console.error('Initial Supabase sync failed:', err)
        } finally {
          if (!cancelled) setIsSyncing(false)
        }
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return
        if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
        if (session) {
          setUser(userFromSession(session))
          setToken(session.access_token)
        } else {
          setUser(null)
          setToken(null)
          setIsPasswordRecovery(false)
        }
      })
      unsubscribe = () => listener.subscription.unsubscribe()
      if (!cancelled) setIsLoading(false)
    }

    init()
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const syncAfterAuth = useCallback(async (nextUser: AuthUser) => {
    setIsSyncing(true)
    try {
      await pullAndMergeCloud(nextUser.id)
    } catch (err) {
      console.error('Cloud sync after auth failed:', err)
      setError(err instanceof Error ? err.message : 'Cloud sync failed')
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      if (!isSupabaseConfigured()) throw new Error('Cloud sync is not configured')
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error(formatAuthError(authError))
      if (!data.session) throw new Error('Sign in failed')
      const nextUser = userFromSession(data.session)
      setUser(nextUser)
      setToken(data.session.access_token)
      await syncAfterAuth(nextUser)
    },
    [syncAfterAuth],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      setError(null)
      if (!isSupabaseConfigured()) throw new Error('Cloud sync is not configured')
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw new Error(formatAuthError(authError))
      if (!data.session) {
        throw new Error('Account created. Check your email to confirm, then sign in.')
      }
      const nextUser = userFromSession(data.session)
      setUser(nextUser)
      setToken(data.session.access_token)
      await syncAfterAuth(nextUser)
    },
    [syncAfterAuth],
  )

  const requestPasswordReset = useCallback(async (email: string) => {
    setError(null)
    if (!isSupabaseConfigured()) throw new Error('Password reset requires Supabase')
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${paths.login()}`,
    })
    if (authError) throw new Error(formatAuthError(authError))
  }, [])

  const updatePassword = useCallback(
    async (password: string) => {
      setError(null)
      if (!isSupabaseConfigured()) throw new Error('Password reset requires Supabase')
      const { data, error: authError } = await supabase.auth.updateUser({ password })
      if (authError) throw new Error(formatAuthError(authError))
      if (!data.user) throw new Error('Could not update password')
      setIsPasswordRecovery(false)
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        const nextUser = userFromSession(sessionData.session)
        setUser(nextUser)
        setToken(sessionData.session.access_token)
        await syncAfterAuth(nextUser)
      }
    },
    [syncAfterAuth],
  )

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut()
    setUser(null)
    setToken(null)
    setIsPasswordRecovery(false)
    setError(null)
  }, [])

  const syncNow = useCallback(async () => {
    if (!user) return
    setIsSyncing(true)
    setError(null)
    try {
      await pullAndMergeCloud(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      throw err
    } finally {
      setIsSyncing(false)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isSupabaseEnabled: isSupabaseConfigured(),
      isPasswordRecovery,
      isLoading,
      isSyncing,
      error,
      login,
      register,
      requestPasswordReset,
      updatePassword,
      logout,
      syncNow,
      clearError: () => setError(null),
    }),
    [
      user,
      token,
      isPasswordRecovery,
      isLoading,
      isSyncing,
      error,
      login,
      register,
      requestPasswordReset,
      updatePassword,
      logout,
      syncNow,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { SettingsProvider, useSettings } from '@/hooks/use-settings'
import { ProgressProvider } from '@/hooks/use-progress'
import { LoginScreen, hasSkippedLogin } from '@/components/auth/login-screen'
import { AppShell } from '@/components/layout/app-shell'
import { HomePage } from '@/components/learn/home-page'
import { PlanPage } from '@/components/learn/plan-page'
import { DayPage } from '@/components/learn/day-page'
import { VocabSession } from '@/components/learn/vocab-session'
import { GrammarSession } from '@/components/learn/grammar-session'
import { ListenSession } from '@/components/learn/listen-session'
import { PracticeSession } from '@/components/learn/practice-session'
import { ReviewPage } from '@/components/learn/review-page'
import { SettingsPage } from '@/components/settings/settings-page'
import { paths } from '@/lib/routes'
import { preloadVoices } from '@/lib/speech'

function OptionalLoginRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isSupabaseEnabled, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isSupabaseEnabled || isAuthenticated || hasSkippedLogin()) return
    if (location.pathname === paths.login()) return
    navigate(paths.login(), { replace: true })
  }, [isAuthenticated, isSupabaseEnabled, isLoading, navigate, location.pathname])

  return null
}

function ThemeSync() {
  const { settings } = useSettings()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(settings.theme)
  }, [settings.theme, setTheme])

  return null
}

function AppRoutes() {
  useEffect(() => {
    preloadVoices()
  }, [])

  return (
    <>
      <ThemeSync />
      <OptionalLoginRedirect />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/learn/:day" element={<DayPage />} />
          <Route path="/learn/:day/vocab" element={<VocabSession />} />
          <Route path="/learn/:day/grammar" element={<GrammarSession />} />
          <Route path="/learn/:day/listen" element={<ListenSession />} />
          <Route path="/learn/:day/practice" element={<PracticeSession />} />
        </Route>
        <Route path="*" element={<Navigate to={paths.home()} replace />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <SettingsProvider>
          <ProgressProvider>
            <AppRoutes />
          </ProgressProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

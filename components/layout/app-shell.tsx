import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Home, Languages, RotateCcw, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/routes'

const NAV = [
  { to: paths.home(), label: 'Today', icon: Home, end: true },
  { to: paths.plan(), label: 'Plan', icon: BookOpen },
  { to: paths.concepts(), label: 'Concepts', icon: Languages },
  { to: paths.review(), label: 'Review', icon: RotateCcw },
  { to: paths.settings(), label: 'Settings', icon: Settings },
]

export function AppShell() {
  return (
    <div className="dusk-wash min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-2 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

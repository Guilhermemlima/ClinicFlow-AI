'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Zap,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/appointments', label: 'Consultas', icon: Calendar },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/automations', label: 'Automações', icon: Zap },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  clinicName: string
}

export function Sidebar({ clinicName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">CF</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">ClinicFlow AI</p>
            <p className="text-slate-400 text-xs truncate">{clinicName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}

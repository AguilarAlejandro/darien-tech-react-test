'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard/lugares', label: 'Lugares', icon: '🏢', adminOnly: false },
  { href: '/dashboard/espacios', label: 'Espacios', icon: '🪑', adminOnly: false },
  { href: '/dashboard/reservas', label: 'Reservas', icon: '📅', adminOnly: false },
  { href: '/dashboard/iot', label: 'IoT Dashboard', icon: '📡', adminOnly: false },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, logout, isLoading } = useAuth()
  const pathname = usePathname()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 animate-pulse">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-teal-700 text-white flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-teal-600">
          <span className="text-xl font-bold tracking-tight">CoworkSpace</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-teal-100 hover:bg-teal-600 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-teal-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-teal-200">Rol actual</span>
            <Badge
              variant="secondary"
              className={`text-xs ${role === 'ADMIN' ? 'bg-emerald-500 text-white hover:bg-emerald-500' : 'bg-teal-500 text-white hover:bg-teal-500'}`}
            >
              {role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full text-teal-100 hover:text-white hover:bg-teal-600 text-xs"
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

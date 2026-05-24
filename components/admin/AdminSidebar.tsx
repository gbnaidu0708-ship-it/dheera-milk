'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { WHATSAPP_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',               icon: '📊', label: 'Dashboard'     },
  { href: '/admin/customers',     icon: '👥', label: 'Customers'     },
  { href: '/admin/subscriptions', icon: '🥛', label: 'Subscriptions' },
  { href: '/admin/deliveries',    icon: '🚚', label: 'Deliveries'    },
  { href: '/admin/billing',       icon: '💰', label: 'Billing'       },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { signOut } = useAuth()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen fixed top-0 left-0 z-30"
      style={{ background: 'var(--blue-deep)' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            🥛
          </div>
          <div>
            <p className="font-bold text-white text-[15px]">Dheera Fresh Milk</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[14px] font-medium',
              isActive(item.href)
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-[14px] font-medium transition-all"
        >
          🏠 View Website
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-[14px] font-medium transition-all"
        >
          💬 WhatsApp
        </a>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-900/20 text-[14px] font-medium transition-all"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}

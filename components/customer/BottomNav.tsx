'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',            icon: '🏠', label: 'Home'     },
  { href: '/dashboard/subscribe',  icon: '🥛', label: 'Subscribe' },
  { href: '/dashboard/deliveries', icon: '🚚', label: 'Delivery'  },
  { href: '/dashboard/billing',    icon: '💰', label: 'Billing'   },
  { href: '/dashboard/profile',    icon: '👤', label: 'Profile'   },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{
        background:   'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop:    '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all', active && 'scale-105')}
            >
              <span className={cn('text-xl transition-all', !active && 'opacity-40')}>{item.icon}</span>
              <span
                className="text-[10px] font-semibold transition-all"
                style={{ color: active ? 'var(--blue)' : 'var(--text-muted)' }}
              >
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full" style={{ background: 'var(--blue)' }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

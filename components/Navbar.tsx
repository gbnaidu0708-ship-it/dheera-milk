'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

const LINKS = [
  { label: 'Products',     href: '#products'     },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Delivery',     href: '#delivery'     },
  { label: 'Reviews',      href: '#testimonials' },
]

export default function Navbar() {
  const { user, loading } = useAuth()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] h-[68px] border-b"
      style={{
        background:   'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderColor:  'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg"
          style={{ background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))' }}
        >
          🥛
        </div>
        <span
          className="font-display font-extrabold text-[22px] tracking-tight"
          style={{ color: 'var(--blue-deep)' }}
        >
          Dheera <span style={{ color: 'var(--green)' }}>Fresh Milk</span>
        </span>
      </div>

      {/* Desktop nav links */}
      <ul className="hidden md:flex gap-8 list-none">
        {LINKS.map(l => (
          <li key={l.href}>
            <a
              href={l.href}
              className="text-sm font-medium transition-colors duration-200 hover:text-[var(--blue)]"
              style={{ color: 'var(--text-muted)' }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!loading && (
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-full border-2 transition-all hover:bg-[var(--blue-light)]"
                  style={{ color: 'var(--blue)', borderColor: 'var(--blue)' }}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--green)' }}
              >
                My Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="hidden sm:inline-flex text-sm font-semibold px-4 py-2 rounded-full border-2 transition-all hover:bg-[var(--blue-light)]"
                style={{ color: 'var(--blue)', borderColor: 'var(--blue)' }}
              >
                Login
              </Link>
              <Link
                href="/auth"
                className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--blue)' }}
              >
                Subscribe Now
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

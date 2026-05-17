'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BrandMark } from '@/components/Brand'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 border-b"
      style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}
    >
      <Link href="/dashboard" aria-label="Dheera Fresh Milk">
        <BrandMark size={32} className="text-[17px]" />
      </Link>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold" style={{ color: 'var(--blue-deep)' }}>
            {user?.name ?? 'Customer'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            +91 {user?.mobile}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs px-3 py-1.5 rounded-full border transition-all hover:bg-red-50"
          style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

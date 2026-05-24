'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fmt } from '@/lib/constants'
import type { AdminStats } from '@/types'
import Card from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import AdminNotifications from '@/components/admin/AdminNotifications'

export default function AdminHome() {
  const { data: stats = null, isPending } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res  = await fetch('/api/admin/dashboard')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data as AdminStats
    },
    // Stats don't change second-to-second; let react-query cache them
    // briefly to avoid refetching on every nav back to /admin.
    staleTime: 60_000,
  })
  const loading = isPending

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const cards = stats ? [
    { label: 'Total Customers',       value: stats.total_customers,                   icon: '👥', bg: '#EAF4FF', color: '#082567' },
    { label: 'Active Subscriptions',  value: stats.active_subscriptions,              icon: '🥛', bg: '#D1FAE5', color: '#065F46' },
    { label: "Today's Deliveries",    value: `${stats.today_delivered}/${stats.today_deliveries}`, icon: '🚚', bg: '#EFF6FF', color: '#1D4ED8' },
    { label: 'Upcoming (this month)', value: stats.month_upcoming,                    icon: '📅', bg: '#F0F4FF', color: '#082567' },
    { label: 'Monthly Revenue',       value: fmt(stats.monthly_revenue),              icon: '💰', bg: '#E6F5EB', color: '#1E8E3E' },
    { label: 'Pending Payments',      value: fmt(stats.pending_payments),             icon: '⚠️', bg: '#FFF3CD', color: '#856404' },
  ] : []

  const quickLinks = [
    { href: '/admin/deliveries',    icon: '🚚', label: 'Mark Deliveries'   },
    { href: '/admin/customers',     icon: '👥', label: 'Manage Customers'  },
    { href: '/admin/billing',       icon: '💰', label: 'Generate Invoices' },
    { href: '/admin/subscriptions', icon: '🥛', label: 'Subscriptions'     },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-deep)' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{today}</p>
        </div>
        <Link
          href="/admin/deliveries"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--blue)' }}
        >
          📋 Today&apos;s Deliveries
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(c => (
            <Card key={c.label} className="!p-4" style={{ background: c.bg }}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs font-semibold mt-1 opacity-70" style={{ color: c.color }}>{c.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Daily notifications */}
      <AdminNotifications />

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--blue-deep)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-card border border-[var(--border)] transition-all hover:-translate-y-1 hover:shadow-card-hover text-center"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fmt, fmtDate } from '@/lib/constants'
import Card from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'

const KEY = ['admin', 'notifications'] as const

type Notifications = {
  today: string
  counts: {
    deliveries_today:         number
    deliveries_pending_today: number
    deliveries_failed_today:  number
    paused_subscriptions:     number
    overdue_invoices:         number
    new_signups_7d:           number
  }
  today_undelivered: Array<{ id: string; user_id: string; status: string; user: { name?: string; mobile?: string } }>
  paused_subs:       Array<{ id: string; user_id: string; user: { name?: string; mobile?: string } }>
  overdue_invoices:  Array<{ id: string; user_id: string; invoice_number: string; pending_amount: number; due_date: string; user: { name?: string; mobile?: string } }>
  new_signups:       Array<{ id: string; name?: string; mobile: string; created_at: string }>
  recent_events:     Array<{ id: string; user_id: string; event_type: string; metadata: any; created_at: string; user: { name?: string; mobile?: string } }>
}

const EVENT_ICON: Record<string, string> = {
  signup: '🆕', login: '🔑',
  subscription_created: '🥛', subscription_modified: '✏️', subscription_cancelled: '❌',
  subscription_paused: '⏸', subscription_resumed: '▶',
  delivery_paused: '⏸', delivery_unpaused: '▶',
  payment_recorded: '💰', invoice_generated: '📄',
  profile_updated: '👤',
}

export default function AdminNotifications() {
  const qc = useQueryClient()
  const { data, isPending } = useQuery<Notifications>({
    queryKey: KEY,
    queryFn: async () => {
      const res  = await fetch('/api/admin/notifications')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data
    },
    staleTime: 60_000,
  })

  if (isPending) return <SkeletonCard />
  if (!data) return null

  const c = data.counts
  const totalAlerts =
    c.deliveries_pending_today +
    c.deliveries_failed_today +
    c.overdue_invoices +
    c.paused_subscriptions

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>🔔 Daily Check</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalAlerts === 0
              ? 'All clear — no action needed today.'
              : `${totalAlerts} item${totalAlerts === 1 ? '' : 's'} need attention`}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: KEY })}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <Pill label="Pending today"    val={c.deliveries_pending_today} bg="#FFF3CD" color="#856404" />
        <Pill label="Failed today"     val={c.deliveries_failed_today}  bg="#FEE2E2" color="#991B1B" />
        <Pill label="Overdue invoices" val={c.overdue_invoices}         bg="#FEE2E2" color="#991B1B" />
        <Pill label="Paused subs"      val={c.paused_subscriptions}     bg="#E0E7FF" color="#3730A3" />
        <Pill label="New signups (7d)" val={c.new_signups_7d}           bg="#D1FAE5" color="#065F46" />
        <Pill label="Deliveries today" val={c.deliveries_today}         bg="#EAF4FF" color="#082567" />
      </div>

      {/* Overdue invoices */}
      {data.overdue_invoices.length > 0 && (
        <Section title={`💸 Overdue invoices · ${data.overdue_invoices.length}`}>
          {data.overdue_invoices.slice(0, 5).map(inv => (
            <Row
              key={inv.id}
              href={`/admin/customers/${inv.user_id}`}
              primary={inv.user?.name ?? `+91 ${inv.user?.mobile}`}
              secondary={`${inv.invoice_number} · due ${fmtDate(inv.due_date)}`}
              right={fmt(Number(inv.pending_amount))}
            />
          ))}
        </Section>
      )}

      {/* Paused subscriptions */}
      {data.paused_subs.length > 0 && (
        <Section title={`⏸ Paused subscriptions · ${data.paused_subs.length}`}>
          {data.paused_subs.slice(0, 5).map(s => (
            <Row
              key={s.id}
              href={`/admin/customers/${s.user_id}`}
              primary={s.user?.name ?? `+91 ${s.user?.mobile}`}
              secondary="Subscription paused"
            />
          ))}
        </Section>
      )}

      {/* New signups */}
      {data.new_signups.length > 0 && (
        <Section title={`🆕 New signups (last 7 days) · ${data.new_signups.length}`}>
          {data.new_signups.slice(0, 5).map(u => (
            <Row
              key={u.id}
              href={`/admin/customers/${u.id}`}
              primary={u.name ?? `+91 ${u.mobile}`}
              secondary={fmtDate(u.created_at)}
            />
          ))}
        </Section>
      )}

      {/* Recent activity */}
      {data.recent_events.length > 0 && (
        <Section title="🕘 Recent activity">
          <ul className="space-y-1.5 mt-1">
            {data.recent_events.slice(0, 8).map(ev => (
              <li key={ev.id} className="flex gap-2 items-start text-xs">
                <span>{EVENT_ICON[ev.event_type] ?? '•'}</span>
                <span className="flex-1 truncate">
                  <Link href={`/admin/customers/${ev.user_id}`} className="font-semibold" style={{ color: 'var(--blue-deep)' }}>
                    {ev.user?.name ?? `+91 ${ev.user?.mobile}`}
                  </Link>
                  <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>
                    {ev.event_type.replace(/_/g, ' ')}
                  </span>
                </span>
                <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {new Date(ev.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Card>
  )
}

function Pill({ label, val, bg, color }: { label: string; val: number; bg: string; color: string }) {
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: bg }}>
      <p className="font-bold text-lg" style={{ color }}>{val}</p>
      <p className="text-[10px] font-semibold opacity-70" style={{ color }}>{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(13,59,159,0.08)' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{title}</p>
      {children}
    </div>
  )
}

function Row({ href, primary, secondary, right }: { href: string; primary: string; secondary?: string; right?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-1.5 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--blue-deep)' }}>{primary}</p>
        {secondary && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{secondary}</p>}
      </div>
      {right && <p className="text-sm font-bold whitespace-nowrap" style={{ color: '#EF4444' }}>{right}</p>}
    </Link>
  )
}

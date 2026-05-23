'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fmt, fmtDate, fmtMonth } from '@/lib/constants'
import type { DbDelivery, DbInvoice, DbSubscription, DbUser } from '@/types'
import Card        from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'

type Detail = {
  user:          DbUser
  subscriptions: DbSubscription[]
  deliveries:    DbDelivery[]
  invoices:      DbInvoice[]
  events:        Array<{ id: string; event_type: string; metadata: any; created_at: string }>
}

const EVENT_LABEL: Record<string, { icon: string; label: string }> = {
  signup:                 { icon: '🆕', label: 'Signed up'             },
  login:                  { icon: '🔑', label: 'Logged in'             },
  subscription_created:   { icon: '🥛', label: 'Subscribed'            },
  subscription_modified:  { icon: '✏️', label: 'Modified plan'         },
  subscription_cancelled: { icon: '❌', label: 'Cancelled subscription'},
  subscription_paused:    { icon: '⏸',  label: 'Paused subscription'   },
  subscription_resumed:   { icon: '▶',  label: 'Resumed subscription'  },
  delivery_paused:        { icon: '⏸',  label: 'Paused a delivery'     },
  delivery_unpaused:      { icon: '▶',  label: 'Resumed a delivery'    },
  payment_recorded:       { icon: '💰', label: 'Payment recorded'      },
  invoice_generated:      { icon: '📄', label: 'Invoice generated'     },
  profile_updated:        { icon: '👤', label: 'Profile updated'       },
}

export default function AdminCustomerDetail({ id }: { id: string }) {
  const { data, isPending, error } = useQuery<Detail>({
    queryKey: ['admin', 'customer', id],
    queryFn: async () => {
      const res  = await fetch(`/api/admin/customers/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data
    },
  })

  if (isPending) {
    return (
      <div className="space-y-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    )
  }
  if (error || !data) {
    return <p className="text-sm" style={{ color: '#EF4444' }}>{(error as any)?.message ?? 'Failed to load'}</p>
  }

  const { user, subscriptions, deliveries, invoices, events } = data
  const activeSub = subscriptions.find(s => s.status === 'active') ?? subscriptions[0]

  const summary = {
    total:     deliveries.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    skipped:   deliveries.filter(d => d.status === 'skipped').length,
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
  }
  const totalPending = invoices.reduce((s, i) => s + Number(i.pending_amount), 0)
  const totalPaid    = invoices.reduce((s, i) => s + Number(i.paid_amount),    0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/customers" className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>
          ← All customers
        </Link>
        <a href={`https://wa.me/91${user.mobile}`} target="_blank" rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: '#D1FAE5', color: '#065F46' }}>
          💬 WhatsApp
        </a>
      </div>

      {/* Identity card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))' }}>
            {(user.name ?? user.mobile)[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>
              {user.name ?? 'No name'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              +91 {user.mobile}{user.email ? ` · ${user.email}` : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {[user.flat_apartment, user.flat_number, user.area].filter(Boolean).join(' · ') || '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Joined {fmtDate(user.created_at)} · Role <span className="font-semibold capitalize">{user.role}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Delivered',  val: summary.delivered, bg: '#D1FAE5', color: '#065F46' },
          { label: 'Upcoming',   val: summary.scheduled, bg: '#EFF6FF', color: '#1D4ED8' },
          { label: 'Skipped',    val: summary.skipped,   bg: '#F3F4F6', color: '#374151' },
          { label: 'Pending ₹',  val: fmt(totalPending), bg: '#FFF3CD', color: '#856404' },
        ].map(s => (
          <Card key={s.label} className="!p-3 text-center" style={{ background: s.bg }}>
            <p className="font-bold text-lg" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] font-semibold uppercase" style={{ color: s.color }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Active subscription */}
      <Card>
        <p className="font-bold mb-3" style={{ color: 'var(--blue-deep)' }}>🥛 Subscription</p>
        {activeSub ? (
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Milk</span>
            <span className="font-semibold capitalize" style={{ color: 'var(--blue-deep)' }}>{activeSub.milk_type}</span>
            <span style={{ color: 'var(--text-muted)' }}>Quantity</span>
            <span className="font-semibold" style={{ color: 'var(--blue-deep)' }}>
              {activeSub.quantity_ml >= 1000 ? `${activeSub.quantity_ml / 1000}L` : `${activeSub.quantity_ml}ml`}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Status</span>
            <span><StatusBadge status={activeSub.status} /></span>
            <span style={{ color: 'var(--text-muted)' }}>Started</span>
            <span className="font-semibold" style={{ color: 'var(--blue-deep)' }}>{fmtDate(activeSub.start_date)}</span>
            <span style={{ color: 'var(--text-muted)' }}>Price / day</span>
            <span className="font-semibold" style={{ color: 'var(--green)' }}>{fmt(Number(activeSub.price_per_unit))}</span>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No subscription</p>
        )}
      </Card>

      {/* Invoices */}
      <Card>
        <p className="font-bold mb-3" style={{ color: 'var(--blue-deep)' }}>📄 Invoices · {fmt(totalPaid)} collected</p>
        {invoices.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No invoices yet</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between border-b last:border-0 py-2"
                style={{ borderColor: 'rgba(13,59,159,0.08)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--blue-deep)' }}>{fmtMonth(inv.month, inv.year)}</p>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{inv.invoice_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>{fmt(Number(inv.total_amount))}</p>
                  <StatusBadge status={inv.payment_status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity timeline */}
      <Card>
        <p className="font-bold mb-3" style={{ color: 'var(--blue-deep)' }}>🕘 Activity</p>
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity recorded yet</p>
        ) : (
          <ul className="space-y-3">
            {events.map(ev => {
              const meta = EVENT_LABEL[ev.event_type] ?? { icon: '•', label: ev.event_type }
              return (
                <li key={ev.id} className="flex gap-3">
                  <span className="text-xl leading-none">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--blue-deep)' }}>{meta.label}</p>
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                        {JSON.stringify(ev.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(ev.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

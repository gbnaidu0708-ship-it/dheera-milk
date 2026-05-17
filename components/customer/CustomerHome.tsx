'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { fmt, fmtDate, WHATSAPP_URL } from '@/lib/constants'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function CustomerHome() {
  const { user } = useAuth()
  const { subscription, todayDelivery, invoices, loading, pause, resume } =
    useSubscription(user?.id ?? null)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const pending  = invoices.find(i => i.payment_status !== 'paid')

  if (loading) return (
    <div className="space-y-4">
      <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
    </div>
  )

  const milkEmoji = (t: string) => t === 'cow' ? '🐄' : t === 'buffalo' ? '🐃' : '🌾'
  const qtyLabel  = (ml: number) => ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Greeting */}
      <div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{greeting} 👋</p>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--blue-deep)' }}>
          {user?.name ?? 'Welcome back!'}
        </h1>
      </div>

      {/* Today's delivery */}
      <Card className={todayDelivery?.status === 'delivered' ? '!border-green-200' : ''}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Today&apos;s Delivery
        </p>
        {todayDelivery ? (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl mb-1">🥛</p>
              <p className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>
                {qtyLabel(todayDelivery.quantity_ml)} Cow Milk
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Expected by 6:00 AM</p>
            </div>
            <StatusBadge status={todayDelivery.status} />
          </div>
        ) : (
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>
            No delivery scheduled today
          </p>
        )}
      </Card>

      {/* Active subscription or CTA */}
      {subscription ? (
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                My Subscription
              </p>
              <p className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>
                {milkEmoji(subscription.milk_type)}{' '}
                {subscription.milk_type.charAt(0).toUpperCase() + subscription.milk_type.slice(1)} Milk
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {qtyLabel(subscription.quantity_ml)} · {subscription.plan_type} · {fmt(subscription.price_per_unit)}/day
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Since {fmtDate(subscription.start_date)}
              </p>
            </div>
            <StatusBadge status={subscription.status} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {subscription.status === 'active' ? (
              <Button variant="outline" size="sm" onClick={() => pause(subscription.id)}>
                ⏸ Pause
              </Button>
            ) : subscription.status === 'paused' ? (
              <Button variant="success" size="sm" onClick={() => resume(subscription.id)}>
                ▶ Resume
              </Button>
            ) : null}
            <Link href="/dashboard/subscribe">
              <Button variant="ghost" size="sm">Modify Plan</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card
          className="text-center py-8"
          style={{ background: 'linear-gradient(160deg,#EAF4FF 0%,#EBF6E3 100%)', borderColor: 'var(--blue)' }}
        >
          <p className="text-4xl mb-2">🥛</p>
          <p className="font-display font-bold text-xl" style={{ color: 'var(--blue-deep)' }}>
            Start your Monthly Subscription
          </p>
          <p className="text-sm mt-1 mb-4 px-2" style={{ color: 'var(--text-muted)' }}>
            Farm-fresh milk delivered every morning by 6 AM.
          </p>
          <Link href="/dashboard/subscribe">
            <Button size="lg">Subscribe Monthly 🎉</Button>
          </Link>
        </Card>
      )}

      {/* Why Organic Cow Milk? */}
      <div>
        <p className="font-bold text-sm mb-2" style={{ color: 'var(--blue-deep)' }}>
          Why Organic Cow Milk?
        </p>
        <Card className="!p-3">
          <ul className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs" style={{ color: 'var(--text)' }}>
            {[
              { icon: '🦴', label: 'Rich in calcium' },
              { icon: '💪', label: 'High protein' },
              { icon: '🌿', label: 'Better digestion' },
              { icon: '🚫', label: 'No preservatives' },
              { icon: '🐄', label: 'Naturally sourced' },
              { icon: '🥛', label: 'Farm to home' },
            ].map(b => (
              <li key={b.label} className="flex items-center gap-2">
                <span className="text-base leading-none">{b.icon}</span>
                <span className="font-medium">{b.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Nutrition snapshot (per 100 ml) */}
      <div>
        <p className="font-bold text-sm mb-2" style={{ color: 'var(--blue-deep)' }}>
          Nutrition per 100 ml
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Energy',   val: '64 kcal' },
            { label: 'Protein',  val: '3.2 g' },
            { label: 'Fat',      val: '3.5 g' },
            { label: 'Calcium',  val: '120 mg' },
          ].map(n => (
            <Card key={n.label} className="!p-2 text-center">
              <p className="font-bold text-sm" style={{ color: 'var(--blue-deep)' }}>{n.val}</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {n.label}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending payment alert */}
      {pending && (
        <Card style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm" style={{ color: '#92400E' }}>⚠️ Payment Pending</p>
              <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
                {fmt(pending.pending_amount)} due for {pending.month}/{pending.year}
              </p>
            </div>
            <Link href="/dashboard/billing">
              <Button size="sm" variant="outline">Pay Now</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/dashboard/deliveries', icon: '📅', label: 'Calendar'  },
          { href: '/dashboard/billing',    icon: '📄', label: 'Invoices'  },
          { href: WHATSAPP_URL,            icon: '💬', label: 'Support', external: true },
        ].map(item =>
          item.external ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 shadow-card border border-[var(--border)] transition-all hover:-translate-y-0.5"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </a>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 shadow-card border border-[var(--border)] transition-all hover:-translate-y-0.5"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </Link>
          )
        )}
      </div>

      {/* Recent invoices */}
      {invoices.length > 0 && (
        <div>
          <p className="font-bold text-sm mb-2" style={{ color: 'var(--blue-deep)' }}>Recent Invoices</p>
          <div className="space-y-2">
            {invoices.slice(0, 3).map(inv => (
              <Card key={inv.id} className="!py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--blue-deep)' }}>
                    {new Date(inv.year, inv.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {inv.total_deliveries} deliveries · {inv.total_liters}L
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: 'var(--green)' }}>{fmt(inv.total_amount)}</p>
                  <StatusBadge status={inv.payment_status} />
                </div>
              </Card>
            ))}
          </div>
          <Link href="/dashboard/billing" className="block text-center mt-2 text-sm font-semibold" style={{ color: 'var(--blue)' }}>
            View all →
          </Link>
        </div>
      )}
    </div>
  )
}

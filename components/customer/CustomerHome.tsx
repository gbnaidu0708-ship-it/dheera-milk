'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { fmt, fmtDate, WHATSAPP_URL } from '@/lib/constants'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import PauseDialog from '@/components/customer/PauseDialog'
import UpiPaymentCard from '@/components/customer/UpiPaymentCard'

export default function CustomerHome() {
  const { user, loading: authLoading } = useAuth()
  const { subscription, todayDelivery, invoices, monthStats, loading: subLoading, resume } =
    useSubscription(user?.id ?? null)
  const [pauseOpen, setPauseOpen] = useState(false)
  const params      = useSearchParams()
  const showUpiTop  = params?.get('upi') === '1'

  const hour     = new Date().getHours()
  const greeting = hour < 5 ? 'Good evening'
                 : hour < 12 ? 'Good morning'
                 : hour < 17 ? 'Good afternoon'
                 : 'Good evening'
  const pending  = invoices.find(i => i.payment_status !== 'paid')

  // Auth gate first — until profile resolves we don't know if there's a
  // subscription. Avoid flashing the "Subscribe" CTA between auth and
  // subscription queries by waiting for both.
  if (authLoading || subLoading) return <HomeSkeleton />



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

          {/* This-month snapshot — always reflects the live status (post-pause too). */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: 'Total',     val: monthStats.total,     color: '#082567', bg: '#EAF4FF' },
              { label: 'Delivered', val: monthStats.delivered, color: '#065F46', bg: '#D1FAE5' },
              { label: 'Upcoming',  val: monthStats.upcoming,  color: '#1D4ED8', bg: '#EFF6FF' },
              { label: 'Paused',    val: monthStats.skipped,   color: '#374151', bg: '#F3F4F6' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-1.5 text-center" style={{ background: s.bg }}>
                <p className="font-bold text-sm" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[9px] font-semibold opacity-70" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {subscription.status !== 'cancelled' && (
              <Button variant="outline" size="sm" onClick={() => setPauseOpen(true)}>
                ⏸ Pause / Resume
              </Button>
            )}
            {subscription.status === 'paused' && (
              <Button variant="success" size="sm" onClick={() => resume(subscription.id)}>
                ▶ Resume rest of month
              </Button>
            )}
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

      {/* Just-subscribed UPI invitation. Shows once when we land here with ?upi=1. */}
      {showUpiTop && subscription && (
        <UpiPaymentCard
          amount={pending?.pending_amount}
          note="Subscription created 🎉 You can pay now or pay by the end of the current month."
        />
      )}

      {/* Pending payment alert + UPI panel */}
      {pending && !showUpiTop && (
        <>
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
          <UpiPaymentCard amount={pending.pending_amount} compact />
        </>
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

      {/* Need help? */}
      <Card style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm" style={{ color: '#065F46' }}>Need help?</p>
            <p className="text-xs mt-0.5" style={{ color: '#047857' }}>
              Reach our team on WhatsApp · +91 96205 44988
            </p>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="sm">💬 Chat</Button>
          </a>
        </div>
      </Card>

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

      {subscription && (
        <PauseDialog
          open={pauseOpen}
          onClose={() => setPauseOpen(false)}
          subscriptionId={subscription.id}
        />
      )}
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-4">
      {/* greeting */}
      <div className="space-y-2">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-7 w-48" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <div className="grid grid-cols-3 gap-3">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  )
}

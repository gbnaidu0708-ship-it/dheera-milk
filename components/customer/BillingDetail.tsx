'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase'
import { fmt, fmtDate, fmtMonth, WHATSAPP_NUMBER } from '@/lib/constants'
import Card        from '@/components/ui/Card'
import Button      from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import UpiPaymentCard from '@/components/customer/UpiPaymentCard'
import type { DbInvoice, DbDelivery } from '@/types'

type Bundle = {
  invoice:    DbInvoice
  deliveries: DbDelivery[]
}

const STATUS_DOT: Record<string, string> = {
  delivered: '#10B981',
  scheduled: '#3B82F6',
  skipped:   '#9CA3AF',
}

export default function BillingDetail({ invoiceId }: { invoiceId: string }) {
  const { user } = useAuth()

  const { data, isPending, error } = useQuery<Bundle>({
    queryKey: ['customer', 'invoice-detail', invoiceId, user?.id ?? null],
    enabled:  !!user,
    queryFn: async () => {
      const sb = getSupabase()
      const { data: invoice, error: invErr } = await sb
        .from('invoices')
        .select('*, payments(*)')
        .eq('id', invoiceId)
        .eq('user_id', user!.id)
        .single()
      if (invErr || !invoice) throw new Error(invErr?.message ?? 'Invoice not found')

      // Pull every delivery in the invoice month.
      const monthStart = `${invoice.year}-${String(invoice.month).padStart(2, '0')}-01`
      const monthEnd   = new Date(invoice.year, invoice.month, 0).toISOString().split('T')[0]
      const { data: deliveries } = await sb
        .from('delivery_schedules')
        .select('*')
        .eq('user_id', user!.id)
        .gte('delivery_date', monthStart)
        .lte('delivery_date', monthEnd)
        .order('delivery_date')

      return { invoice: invoice as DbInvoice, deliveries: (deliveries ?? []) as DbDelivery[] }
    },
  })

  if (isPending) {
    return <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
  }
  if (error || !data) {
    return (
      <p className="text-sm" style={{ color: '#EF4444' }}>
        {(error as any)?.message ?? 'Failed to load invoice'}
      </p>
    )
  }

  const { invoice, deliveries } = data
  const delivered = deliveries.filter(d => d.status === 'delivered')
  const skipped   = deliveries.filter(d => d.status === 'skipped')
  const upcoming  = deliveries.filter(d => d.status === 'scheduled')

  const payViaWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello Dheera Fresh Milk! 💰\n\nI'd like to pay invoice ${invoice.invoice_number} ` +
      `for ${fmtMonth(invoice.month, invoice.year)} (${fmt(invoice.pending_amount)} due). Thanks!`,
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <Link href="/dashboard/billing" className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>
        ← All invoices
      </Link>

      <Card>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>
              {fmtMonth(invoice.month, invoice.year)}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {invoice.invoice_number}
            </p>
            {invoice.due_date && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Due {fmtDate(invoice.due_date)}
              </p>
            )}
          </div>
          <StatusBadge status={invoice.payment_status} />
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl" style={{ background: 'var(--blue-light)' }}>
          {[
            { label: 'Total',   val: fmt(invoice.total_amount),   color: 'var(--blue-deep)' },
            { label: 'Paid',    val: fmt(invoice.paid_amount),    color: 'var(--green)'     },
            { label: 'Pending', val: fmt(invoice.pending_amount), color: invoice.pending_amount > 0 ? '#EF4444' : 'var(--green)' },
          ].map(a => (
            <div key={a.label} className="text-center">
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>{a.label}</p>
              <p className="font-bold text-sm" style={{ color: a.color }}>{a.val}</p>
            </div>
          ))}
        </div>
      </Card>

      {invoice.pending_amount > 0 && (
        <>
          <UpiPaymentCard amount={invoice.pending_amount} />
          <div className="flex gap-2 flex-wrap">
            <Button variant="whatsapp" size="sm" onClick={payViaWhatsApp}>💬 Pay via WhatsApp</Button>
          </div>
        </>
      )}

      {/* Breakdown */}
      <Card>
        <p className="font-bold mb-3" style={{ color: 'var(--blue-deep)' }}>📦 Delivery breakdown</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Delivered', val: delivered.length, bg: '#D1FAE5', color: '#065F46' },
            { label: 'Upcoming',  val: upcoming.length,  bg: '#EFF6FF', color: '#1D4ED8' },
            { label: 'Paused',    val: skipped.length,   bg: '#F3F4F6', color: '#374151' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: s.bg }}>
              <p className="font-bold text-base" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px] font-semibold opacity-70" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Day-by-day
        </p>
        <ul className="divide-y" style={{ borderColor: 'rgba(13,59,159,0.06)' }}>
          {deliveries.map(d => (
            <li key={d.id} className="flex items-center gap-3 py-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[d.status] ?? '#9CA3AF' }} />
              <span className="text-sm flex-1" style={{ color: 'var(--blue-deep)' }}>
                {format(parseISO(d.delivery_date), 'EEE, dd MMM')}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {d.quantity_ml >= 1000 ? `${d.quantity_ml / 1000}L` : `${d.quantity_ml}ml`}
              </span>
              <StatusBadge status={d.status} />
            </li>
          ))}
          {deliveries.length === 0 && (
            <li className="py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              No deliveries this month.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}

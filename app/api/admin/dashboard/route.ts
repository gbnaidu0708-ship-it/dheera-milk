import { NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { currentMonthRange } from '@/lib/month'

export async function GET() {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { start: monthStart, end: monthEnd, today } = currentMonthRange()

  const [
    { count: customers },
    { count: activeSubs },
    { data: todayDels },
    { data: monthDels },
    { data: monthInv },
    { data: pendingInv },
  ] = await Promise.all([
    sb.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    sb.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('delivery_schedules').select('status').eq('delivery_date', today),
    sb.from('delivery_schedules').select('status').gte('delivery_date', monthStart).lte('delivery_date', monthEnd),
    sb.from('invoices').select('paid_amount').gte('created_at', monthStart),
    sb.from('invoices').select('pending_amount,due_date').in('payment_status', ['pending', 'partial', 'overdue']),
  ])

  const upcoming = (monthDels ?? []).filter(d => d.status === 'scheduled').length
  const delivered = (monthDels ?? []).filter(d => d.status === 'delivered').length
  const skipped   = (monthDels ?? []).filter(d => d.status === 'skipped').length

  return NextResponse.json({
    data: {
      total_customers:      customers ?? 0,
      active_subscriptions: activeSubs ?? 0,
      today_deliveries:     todayDels?.length ?? 0,
      today_delivered:      todayDels?.filter(d => d.status === 'delivered').length ?? 0,
      // Month-only delivery stats (per spec: "ONLY current month").
      month_deliveries:     monthDels?.length ?? 0,
      month_delivered:      delivered,
      month_upcoming:       upcoming,
      month_skipped:        skipped,
      monthly_revenue:      monthInv?.reduce((s, i) => s + Number(i.paid_amount), 0) ?? 0,
      pending_payments:     pendingInv?.reduce((s, i) => s + Number(i.pending_amount), 0) ?? 0,
    },
  })
}

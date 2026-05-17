import { NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'

export async function GET() {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const today      = new Date().toISOString().split('T')[0]
  const now        = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { count: customers },
    { count: activeSubs },
    { data: todayDels },
    { data: monthInv },
    { data: pendingInv },
  ] = await Promise.all([
    sb.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    sb.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('delivery_schedules').select('status').eq('delivery_date', today),
    sb.from('invoices').select('paid_amount').gte('created_at', monthStart),
    sb.from('invoices').select('pending_amount').in('payment_status', ['pending', 'partial', 'overdue']),
  ])

  return NextResponse.json({
    data: {
      total_customers:      customers ?? 0,
      active_subscriptions: activeSubs ?? 0,
      today_deliveries:     todayDels?.length ?? 0,
      today_delivered:      todayDels?.filter(d => d.status === 'delivered').length ?? 0,
      monthly_revenue:      monthInv?.reduce((s, i) => s + Number(i.paid_amount), 0) ?? 0,
      pending_payments:     pendingInv?.reduce((s, i) => s + Number(i.pending_amount), 0) ?? 0,
    },
  })
}

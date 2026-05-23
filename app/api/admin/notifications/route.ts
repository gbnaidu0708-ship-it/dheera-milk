import { NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'

// Aggregates "things the admin should look at today" without persisting a
// per-notification table. Cheap, idempotent, and good enough for a daily check.
export async function GET() {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile)               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const today      = new Date().toISOString().split('T')[0]
  const sevenAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: scheduledToday },
    { data: pausedSubs },
    { data: overdueInv },
    { data: newSignups },
    { data: recentEvents },
  ] = await Promise.all([
    sb.from('delivery_schedules')
      .select('id, user_id, status, user:users(name,mobile)')
      .eq('delivery_date', today),
    sb.from('subscriptions')
      .select('id, user_id, status, user:users(name,mobile)')
      .eq('status', 'paused'),
    sb.from('invoices')
      .select('id, user_id, invoice_number, pending_amount, due_date, user:users(name,mobile)')
      .in('payment_status', ['pending', 'partial', 'overdue'])
      .lte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(20),
    sb.from('users')
      .select('id, name, mobile, created_at')
      .eq('role', 'customer')
      .gte('created_at', sevenAgo)
      .order('created_at', { ascending: false })
      .limit(20),
    sb.from('user_events')
      .select('id, user_id, event_type, metadata, created_at, user:users(name,mobile)')
      .order('created_at', { ascending: false })
      .limit(25),
  ])

  const todaySch         = scheduledToday ?? []
  const todayPending     = todaySch.filter(d => d.status === 'scheduled')
  const todayUndelivered = todaySch.filter(d => d.status === 'scheduled' || d.status === 'failed')

  return NextResponse.json({
    data: {
      today,
      counts: {
        deliveries_today:         todaySch.length,
        deliveries_pending_today: todayPending.length,
        deliveries_failed_today:  todaySch.filter(d => d.status === 'failed').length,
        paused_subscriptions:     pausedSubs?.length ?? 0,
        overdue_invoices:         overdueInv?.length ?? 0,
        new_signups_7d:           newSignups?.length ?? 0,
      },
      today_undelivered: todayUndelivered,
      paused_subs:       pausedSubs ?? [],
      overdue_invoices:  overdueInv ?? [],
      new_signups:       newSignups ?? [],
      recent_events:     recentEvents ?? [],
    },
  })
}

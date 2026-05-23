import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { recordEvent } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = new URL(req.url).searchParams.get('user_id')

  let q = sb.from('invoices').select('*, user:users(name,mobile), payments(*)').order('created_at', { ascending: false })
  if (profile.role !== 'admin') q = q.eq('user_id', profile.id)
  else if (userId)              q = q.eq('user_id', userId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, month, year } = await req.json()

  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const last  = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

  // Invoices are only generated for monthly-subscribed customers. A user
  // qualifies if they have a 'daily' subscription that overlaps this billing
  // period (created on/before the period end, and either never cancelled or
  // cancelled after the period start).
  const { data: monthlySubs } = await sb
    .from('subscriptions')
    .select('id,status,start_date,end_date,plan_type')
    .eq('user_id', user_id)
    .eq('plan_type', 'daily')
    .lte('start_date', last)

  const hasMonthly = monthlySubs?.some(s => !s.end_date || s.end_date >= start) ?? false
  if (!hasMonthly) {
    return NextResponse.json(
      { error: 'User has no monthly subscription for this period' },
      { status: 400 },
    )
  }

  const { data: deliveries } = await sb
    .from('delivery_schedules')
    .select('*, subscription:subscriptions(price_per_unit,quantity_ml)')
    .eq('user_id', user_id)
    .eq('status', 'delivered')
    .gte('delivery_date', start)
    .lte('delivery_date', last)

  if (!deliveries?.length) return NextResponse.json({ error: 'No delivered deliveries found for this period' }, { status: 400 })

  const total_amount = deliveries.reduce((s, d) => s + Number((d.subscription as any)?.price_per_unit ?? 0), 0)
  const total_liters = deliveries.reduce((s, d) => s + d.quantity_ml / 1000, 0)
  const due_date     = new Date(Number(year), Number(month), 10).toISOString().split('T')[0]

  const { data, error } = await sb
    .from('invoices')
    .upsert(
      { user_id, month, year, total_deliveries: deliveries.length, total_liters, total_amount, paid_amount: 0, due_date },
      { onConflict: 'user_id,month,year' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recordEvent(sb, user_id, 'invoice_generated', {
    invoice_id:   data.id,
    invoice_no:   data.invoice_number,
    month, year,
    total_amount: data.total_amount,
  })

  return NextResponse.json({ data })
}

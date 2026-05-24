import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { recordEvent } from '@/lib/audit'
import { recalcInvoice } from '@/lib/invoices'
import { monthFirstDay, monthLastDay } from '@/lib/month'

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
  const start = monthFirstDay(Number(year), Number(month))
  const last  = monthLastDay(Number(year), Number(month))

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

  const data = await recalcInvoice(sb, user_id, Number(year), Number(month))
  if (!data) {
    return NextResponse.json(
      { error: 'No deliveries to invoice for this period' },
      { status: 400 },
    )
  }

  await recordEvent(sb, user_id, 'invoice_generated', {
    invoice_id:   data.id,
    invoice_no:   data.invoice_number,
    month, year,
    total_amount: data.total_amount,
  })

  return NextResponse.json({ data })
}

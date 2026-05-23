import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'
import { addDays, eachDayOfInterval, parseISO } from 'date-fns'
import { MILK_PRICE } from '@/lib/constants'
import { recordEvent } from '@/lib/audit'

// Monthly subscription only. quantity_ml must be a positive multiple of 500
// (matches the DB CHECK) up to 20 L; plan_type is forced to 'daily'.
const createSchema = z.object({
  milk_type:   z.enum(['cow', 'buffalo', 'a2']),
  quantity_ml: z
    .number()
    .int()
    .min(500)
    .max(20000)
    .refine(v => v % 500 === 0, 'Quantity must be in 500 ml steps'),
  plan_type:   z.literal('daily').optional(),
  start_date:  z.string(),
})

const modifySchema = z.object({
  id:          z.string().uuid(),
  milk_type:   z.enum(['cow', 'buffalo', 'a2']).optional(),
  quantity_ml: z
    .number()
    .int()
    .min(500)
    .max(20000)
    .refine(v => v % 500 === 0, 'Quantity must be in 500 ml steps')
    .optional(),
  start_date:  z.string().optional(),
  status:      z.enum(['active', 'paused', 'cancelled']).optional(),
})

export async function GET() {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await sb
    .from('subscriptions')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body   = createSchema.parse(await req.json())
    const price  = (MILK_PRICE[body.milk_type] ?? 60) * (body.quantity_ml / 1000)

    const { data: sub, error: subErr } = await sb
      .from('subscriptions')
      .insert({
        user_id:        profile.id,
        milk_type:      body.milk_type,
        quantity_ml:    body.quantity_ml,
        plan_type:      'daily',
        start_date:     body.start_date,
        price_per_unit: price,
      })
      .select()
      .single()

    if (subErr || !sub) return NextResponse.json({ error: subErr?.message ?? 'Failed' }, { status: 500 })

    // Auto-generate 30-day daily delivery schedule.
    const start = parseISO(body.start_date)
    const end   = addDays(start, 29)
    const dates = eachDayOfInterval({ start, end })

    const schedules = dates.map(d => ({
      subscription_id: sub.id,
      user_id:         profile.id,
      delivery_date:   d.toISOString().split('T')[0],
      quantity_ml:     body.quantity_ml,
      status:          'scheduled',
    }))

    if (schedules.length) await sb.from('delivery_schedules').insert(schedules)

    await recordEvent(sb, profile.id, 'subscription_created', {
      subscription_id: sub.id,
      milk_type:       body.milk_type,
      quantity_ml:     body.quantity_ml,
      schedules:       schedules.length,
    })

    return NextResponse.json({ data: sub, schedules_created: schedules.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = modifySchema.parse(await req.json())

    // Pull the current row so we can recompute price and validate ownership.
    const { data: existing, error: getErr } = await sb
      .from('subscriptions')
      .select('id, user_id, milk_type, quantity_ml, start_date, status')
      .eq('id', body.id)
      .single()
    if (getErr || !existing) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    if (existing.user_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const next = {
      milk_type:   body.milk_type   ?? existing.milk_type,
      quantity_ml: body.quantity_ml ?? existing.quantity_ml,
      start_date:  body.start_date  ?? existing.start_date,
      status:      body.status      ?? existing.status,
    }
    const price = (MILK_PRICE[next.milk_type] ?? 60) * (next.quantity_ml / 1000)

    const { data: updated, error: updErr } = await sb
      .from('subscriptions')
      .update({
        milk_type:      next.milk_type,
        quantity_ml:    next.quantity_ml,
        start_date:     next.start_date,
        status:         next.status,
        price_per_unit: price,
      })
      .eq('id', body.id)
      .select()
      .single()
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // If qty changed, propagate to every future *scheduled* row so calendar
    // + today's-delivery card show the new quantity instantly.
    if (body.quantity_ml && body.quantity_ml !== existing.quantity_ml) {
      const today = new Date().toISOString().split('T')[0]
      await sb
        .from('delivery_schedules')
        .update({ quantity_ml: body.quantity_ml })
        .eq('subscription_id', body.id)
        .eq('status', 'scheduled')
        .gte('delivery_date', today)
    }

    await recordEvent(sb, profile.id, 'subscription_modified', {
      subscription_id: body.id,
      from: existing,
      to:   next,
    })

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

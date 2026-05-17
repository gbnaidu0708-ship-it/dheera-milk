import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'
import { addDays, eachDayOfInterval, parseISO } from 'date-fns'
import { MILK_PRICE } from '@/lib/constants'

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
    const price  = (MILK_PRICE[body.milk_type] ?? 60) * (body.quantity_ml / 500)

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

    return NextResponse.json({ data: sub, schedules_created: schedules.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  if (!['active', 'paused', 'cancelled'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const { data, error } = await sb.from('subscriptions').update({ status }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

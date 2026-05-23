import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'
import { recordEvent } from '@/lib/audit'

// Resume = restore future skipped days back to 'scheduled' (optionally bounded
// by a date range) and, if the sub was paused, mark it active again.
const schema = z.object({
  subscription_id: z.string().uuid(),
  from: z.string().optional(),
  to:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body  = schema.parse(await req.json())
    const today = new Date().toISOString().split('T')[0]

    const { data: sub, error: subErr } = await sb
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('id', body.subscription_id)
      .single()
    if (subErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    if (sub.user_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let q = sb
      .from('delivery_schedules')
      .update({ status: 'scheduled' })
      .eq('subscription_id', sub.id)
      .eq('status', 'skipped')
      .gte('delivery_date', body.from ?? today)
    if (body.to) q = q.lte('delivery_date', body.to)

    const { data: restored, error: restoreErr } = await q.select('id')
    if (restoreErr) return NextResponse.json({ error: restoreErr.message }, { status: 500 })

    await sb.from('subscriptions').update({ status: 'active' }).eq('id', sub.id)

    await recordEvent(sb, profile.id, 'subscription_resumed', {
      subscription_id: sub.id,
      restored_count: restored?.length ?? 0,
    })

    return NextResponse.json({ data: { restored_count: restored?.length ?? 0 } })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'
import { recordEvent } from '@/lib/audit'
import { recalcInvoice } from '@/lib/invoices'

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

    const { data: restored, error: restoreErr } = await q.select('id, delivery_date')
    if (restoreErr) return NextResponse.json({ error: restoreErr.message }, { status: 500 })

    // Flip the sub to 'active' only if there's at least one scheduled row in
    // the future — otherwise leave it as-is (e.g. cancelled or fully paused).
    const { count: futureScheduled } = await sb
      .from('delivery_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_id', sub.id)
      .eq('status', 'scheduled')
      .gte('delivery_date', today)

    if ((futureScheduled ?? 0) > 0 && sub.status !== 'cancelled') {
      await sb.from('subscriptions').update({ status: 'active' }).eq('id', sub.id)
    }

    // Recalc invoices for the months whose schedules were restored.
    const months = new Set<string>()
    for (const row of restored ?? []) {
      const [y, m] = row.delivery_date.split('-').map(Number)
      months.add(`${y}-${m}`)
    }
    if (months.size === 0) {
      // Even without bounded rows we still need the current month re-totalled.
      const now = new Date()
      months.add(`${now.getFullYear()}-${now.getMonth() + 1}`)
    }
    for (const key of Array.from(months)) {
      const [y, m] = key.split('-').map(Number)
      await recalcInvoice(sb, profile.id, y, m)
    }

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

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'
import { recordEvent } from '@/lib/audit'

// Date range OR whole-month pause. Marks the matching delivery_schedules rows
// as 'skipped'. If the range spans every remaining day of an active sub, the
// subscription itself is also moved to status='paused' so the home card shows
// the paused state.
const schema = z.object({
  subscription_id: z.string().uuid(),
  scope: z.discriminatedUnion('type', [
    z.object({ type: z.literal('range'), from: z.string(), to: z.string() }),
    z.object({ type: z.literal('month'), year: z.number().int(), month: z.number().int().min(1).max(12) }),
  ]),
})

function monthBounds(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0]
  return { from, to: last }
}

export async function POST(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = schema.parse(await req.json())

    const { from, to } =
      body.scope.type === 'range'
        ? { from: body.scope.from, to: body.scope.to }
        : monthBounds(body.scope.year, body.scope.month)

    if (from > to) {
      return NextResponse.json({ error: '"From" date must be on or before "To"' }, { status: 400 })
    }
    const today = new Date().toISOString().split('T')[0]
    if (from < today) {
      return NextResponse.json({ error: 'Cannot pause past deliveries' }, { status: 400 })
    }

    const { data: sub, error: subErr } = await sb
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('id', body.subscription_id)
      .single()
    if (subErr || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    if (sub.user_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Skip only the schedules still 'scheduled' — never overwrite delivered/failed rows.
    const { data: skipped, error: skipErr } = await sb
      .from('delivery_schedules')
      .update({ status: 'skipped' })
      .eq('subscription_id', sub.id)
      .eq('status', 'scheduled')
      .gte('delivery_date', from)
      .lte('delivery_date', to)
      .select('id, delivery_date')
    if (skipErr) return NextResponse.json({ error: skipErr.message }, { status: 500 })

    // If everything that's left is now skipped, flip the sub to paused.
    const { count: remaining } = await sb
      .from('delivery_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_id', sub.id)
      .eq('status', 'scheduled')
      .gte('delivery_date', today)

    if ((remaining ?? 0) === 0) {
      await sb.from('subscriptions').update({ status: 'paused' }).eq('id', sub.id)
    }

    await recordEvent(sb, profile.id, 'subscription_paused', {
      subscription_id: sub.id,
      from, to,
      skipped_count: skipped?.length ?? 0,
    })

    return NextResponse.json({ data: { skipped_count: skipped?.length ?? 0, from, to } })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

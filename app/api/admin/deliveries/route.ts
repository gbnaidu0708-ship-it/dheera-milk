import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { recalcInvoice } from '@/lib/invoices'

const updateSchema = z.object({
  ids:    z.array(z.string().uuid()).min(1),
  status: z.enum(['scheduled', 'delivered', 'skipped', 'failed']),
})

// Bulk + single delivery status updates for admins. Marking delivered stamps
// delivered_at; any other transition clears it. Also recalcs each affected
// customer's current-month invoice so totals stay in sync.
export async function PATCH(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile)                  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (profile.role !== 'admin')  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { ids, status } = updateSchema.parse(await req.json())
    const delivered_at = status === 'delivered' ? new Date().toISOString() : null

    const { data: updated, error } = await sb
      .from('delivery_schedules')
      .update({ status, delivered_at })
      .in('id', ids)
      .select('id, user_id, delivery_date')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Recalc the (user, year, month) combos that were touched.
    const buckets = new Set<string>()
    for (const row of updated ?? []) {
      const [y, m] = row.delivery_date.split('-').map(Number)
      buckets.add(`${row.user_id}|${y}|${m}`)
    }
    await Promise.all(
      Array.from(buckets).map(b => {
        const [userId, y, m] = b.split('|')
        return recalcInvoice(sb, userId, Number(y), Number(m))
      }),
    )

    return NextResponse.json({ data: { updated: updated?.length ?? 0 } })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

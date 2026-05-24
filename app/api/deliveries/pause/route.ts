import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'
import { PAUSE_CUTOFF_HOUR } from '@/lib/constants'
import { recordEvent } from '@/lib/audit'
import { recalcInvoice } from '@/lib/invoices'

const schema = z.object({
  delivery_id: z.string().uuid(),
  action:      z.enum(['pause', 'unpause']),
})

// Cutoff: requests to pause (or unpause) delivery on date D must be made
// before `PAUSE_CUTOFF_HOUR`:00 IST on D-1.
function cutoffForDelivery(deliveryDate: string): Date {
  const [y, m, d] = deliveryDate.split('-').map(Number)
  const prev      = new Date(Date.UTC(y, m - 1, d))
  prev.setUTCDate(prev.getUTCDate() - 1)
  const yy = prev.getUTCFullYear()
  const mm = String(prev.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(prev.getUTCDate()).padStart(2, '0')
  const hh = String(PAUSE_CUTOFF_HOUR).padStart(2, '0')
  return new Date(`${yy}-${mm}-${dd}T${hh}:00:00+05:30`)
}

export async function POST(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { delivery_id, action } = schema.parse(await req.json())

    const { data: row, error: fetchErr } = await sb
      .from('delivery_schedules')
      .select('id,user_id,delivery_date,status')
      .eq('id', delivery_id)
      .single()
    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }
    if (row.user_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (row.status === 'delivered') {
      return NextResponse.json({ error: 'Already delivered' }, { status: 400 })
    }

    if (Date.now() >= cutoffForDelivery(row.delivery_date).getTime()) {
      return NextResponse.json(
        { error: `Requests must be made before ${PAUSE_CUTOFF_HOUR}:00 the previous day` },
        { status: 400 },
      )
    }

    if (action === 'pause' && row.status === 'skipped') {
      return NextResponse.json({ data: row })
    }

    const nextStatus = action === 'pause' ? 'skipped' : 'scheduled'
    const { data, error } = await sb
      .from('delivery_schedules')
      .update({ status: nextStatus })
      .eq('id', delivery_id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Refresh the month's invoice so totals reflect the toggled day.
    const [yy, mm] = row.delivery_date.split('-').map(Number)
    await recalcInvoice(sb, profile.id, yy, mm)

    await recordEvent(
      sb,
      profile.id,
      action === 'pause' ? 'delivery_paused' : 'delivery_unpaused',
      { delivery_id, date: row.delivery_date },
    )

    return NextResponse.json({ data })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

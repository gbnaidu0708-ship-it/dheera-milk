// Server-side helpers for invoice generation and dynamic recalculation.
// All math uses scheduled + delivered rows so paused days correctly skip charges.

import { MILK_PRICE } from '@/lib/constants'
import { monthFirstDay, monthLastDay, pad2 } from '@/lib/month'

type SbClient = {
  from: (table: string) => any
}

// Days that count toward a monthly invoice. Skipped/failed days are excluded.
// "scheduled" days are billed because they're still planned to be delivered.
function isBillable(status: string): boolean {
  return status === 'scheduled' || status === 'delivered'
}

// Recompute (or create) the invoice for a given user / month / year based on
// the current delivery_schedules + subscriptions in the database. Idempotent:
// uses upsert on the UNIQUE(user_id, month, year) constraint, so calling this
// after every subscription mutation never duplicates rows.
//
// Returns the upserted invoice row or null if there's nothing to invoice.
export async function recalcInvoice(
  sb: SbClient,
  userId: string,
  year: number,
  month: number,
): Promise<any | null> {
  const start = monthFirstDay(year, month)
  const last  = monthLastDay(year, month)

  const { data: deliveries } = await sb
    .from('delivery_schedules')
    .select('id,status,quantity_ml,subscription_id,delivery_date,subscription:subscriptions(milk_type,price_per_unit)')
    .eq('user_id', userId)
    .gte('delivery_date', start)
    .lte('delivery_date', last)

  if (!deliveries) return null

  const billed = deliveries.filter((d: any) => isBillable(d.status))

  // Recompute amount per delivery using the subscription's saved price_per_unit
  // (1-litre price × quantity / 1000) so quantity changes propagate correctly.
  let totalAmount  = 0
  let totalLiters  = 0
  for (const d of billed) {
    const litres = Number(d.quantity_ml) / 1000
    const milk   = d.subscription?.milk_type ?? 'cow'
    const perL   = Number(d.subscription?.price_per_unit ?? 0) || (MILK_PRICE[milk] ?? 60)
    totalAmount += perL * litres
    totalLiters += litres
  }

  // If nothing is billable and no existing invoice, leave the table alone.
  const { data: existing } = await sb
    .from('invoices')
    .select('id, paid_amount')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (!existing && billed.length === 0) return null

  const paidAmount = Number(existing?.paid_amount ?? 0)
  const dueDate    = `${year}-${pad2(month)}-10`

  // Recompute status from the new totals.
  const status =
    paidAmount >= totalAmount && totalAmount > 0 ? 'paid'
    : paidAmount > 0                              ? 'partial'
    :                                               'pending'

  const { data, error } = await sb
    .from('invoices')
    .upsert(
      {
        user_id:          userId,
        month,
        year,
        total_deliveries: billed.length,
        total_liters:     Number(totalLiters.toFixed(2)),
        total_amount:     Number(totalAmount.toFixed(2)),
        paid_amount:      paidAmount,
        payment_status:   status,
        due_date:         dueDate,
      },
      { onConflict: 'user_id,month,year' },
    )
    .select()
    .single()

  if (error) return null
  return data
}

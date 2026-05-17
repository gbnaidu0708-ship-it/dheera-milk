import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  invoice_id:     z.string().uuid(),
  payment_method: z.enum(['upi', 'cash', 'razorpay', 'bank_transfer']),
  amount:         z.number().positive(),
  transaction_id: z.string().optional(),
  notes:          z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const sb      = createServerSupabase()
    const profile = await getProfile(sb)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = schema.parse(await req.json())
    const { data: inv } = await sb.from('invoices').select('*').eq('id', body.invoice_id).single()
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const { data: payment, error } = await sb
      .from('payments')
      .insert({ ...body, user_id: inv.user_id, payment_date: new Date().toISOString().split('T')[0], status: 'completed' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const newPaid  = Number(inv.paid_amount) + body.amount
    const ps       = newPaid >= Number(inv.total_amount) ? 'paid' : newPaid > 0 ? 'partial' : 'pending'
    await sb.from('invoices').update({ paid_amount: newPaid, payment_status: ps }).eq('id', body.invoice_id)

    return NextResponse.json({ data: payment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoiceId = new URL(req.url).searchParams.get('invoice_id')
  const { data, error } = await sb.from('payments').select('*').eq('invoice_id', invoiceId!).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

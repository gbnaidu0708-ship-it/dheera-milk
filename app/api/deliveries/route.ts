import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp     = new URL(req.url).searchParams
  const date   = sp.get('date')
  const month  = sp.get('month')
  const year   = sp.get('year')
  const status = sp.get('status')

  let q = sb.from('delivery_schedules').select('*, user:users(name,mobile,address,area)')

  if (profile.role !== 'admin') q = q.eq('user_id', profile.id)

  if (date)         q = q.eq('delivery_date', date)
  if (status)       q = q.eq('status', status)
  if (month && year) {
    const start = `${year}-${month.padStart(2, '0')}-01`
    const last  = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
    q = q.gte('delivery_date', start).lte('delivery_date', last)
  }

  const { data, error } = await q.order('delivery_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, notes } = await req.json()
  const upd: Record<string, any> = { status }
  if (notes) upd.notes = notes
  if (status === 'delivered') upd.delivered_at = new Date().toISOString()

  const { data, error } = await sb.from('delivery_schedules').update(upd).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

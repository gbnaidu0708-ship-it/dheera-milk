import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb      = createServerSupabase()
  const profile = await getProfile(sb)
  if (!profile)               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [
    { data: user },
    { data: subs },
    { data: deliveries },
    { data: invoices },
    { data: events },
  ] = await Promise.all([
    sb.from('users').select('*').eq('id', params.id).single(),
    sb.from('subscriptions').select('*').eq('user_id', params.id).order('created_at', { ascending: false }),
    sb.from('delivery_schedules').select('*').eq('user_id', params.id).order('delivery_date', { ascending: false }).limit(60),
    sb.from('invoices').select('*, payments(*)').eq('user_id', params.id).order('created_at', { ascending: false }),
    sb.from('user_events').select('*').eq('user_id', params.id).order('created_at', { ascending: false }).limit(100),
  ])

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    data: {
      user,
      subscriptions: subs ?? [],
      deliveries:    deliveries ?? [],
      invoices:      invoices ?? [],
      events:        events ?? [],
    },
  })
}

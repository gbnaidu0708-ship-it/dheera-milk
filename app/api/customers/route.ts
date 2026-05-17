import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getProfile } from '@/lib/supabase-server'

async function adminGuard(sb: any) {
  const profile = await getProfile(sb)
  return profile?.role === 'admin' ? profile : null
}

export async function GET(req: NextRequest) {
  const sb    = createServerSupabase()
  const admin = await adminGuard(sb)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp     = new URL(req.url).searchParams
  const search = sp.get('search') ?? ''
  const page   = Number(sp.get('page') ?? 1)
  const limit  = Number(sp.get('limit') ?? 20)

  let q = sb
    .from('users')
    .select('*, subscriptions(id,milk_type,status)', { count: 'exact' })
    .eq('role', 'customer')
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false })

  if (search) q = q.or(`name.ilike.%${search}%,mobile.ilike.%${search}%`)

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}

export async function PATCH(req: NextRequest) {
  const sb    = createServerSupabase()
  const admin = await adminGuard(sb)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, ...updates } = await req.json()
  const { data, error } = await sb.from('users').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

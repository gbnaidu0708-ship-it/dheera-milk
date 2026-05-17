import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  name:           z.string().trim().min(1, 'Name required').max(80),
  email:          z.string().trim().toLowerCase().email(),
  phone:          z.string().trim(),
  password:       z.string().min(6, 'Password must be at least 6 characters'),
  flat_apartment: z.string().trim().min(1, 'Apartment / society name is required').max(120),
  flat_number:    z.string().trim().min(1, 'Flat number is required').max(40),
  address:        z.string().trim().min(1, 'Address is required').max(240),
})

function normalizePhone(input: string): string | null {
  const digits = input.replace(/^(\+91|91|0)/, '').replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? digits : null
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const mobile = normalizePhone(body.phone)
    if (!mobile) return NextResponse.json({ error: 'Enter a valid 10-digit mobile' }, { status: 400 })

    const sb = createServerSupabase()

    const { data, error } = await sb.auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { name: body.name, mobile } },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data.user) return NextResponse.json({ error: 'Signup failed' }, { status: 400 })

    const { error: profileErr } = await sb.from('users').insert({
      auth_id:        data.user.id,
      name:           body.name,
      email:          body.email,
      mobile,
      role:           'customer',
      flat_apartment: body.flat_apartment,
      flat_number:    body.flat_number,
      address:        body.address,
    })
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      needs_confirmation: !data.session,
    })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Signup failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

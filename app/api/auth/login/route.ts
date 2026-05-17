import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone required'),
  password:   z.string().min(1, 'Password required'),
})

function normalizePhone(input: string): string | null {
  const digits = input.replace(/^(\+91|91|0)/, '').replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? digits : null
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = schema.parse(await req.json())

    const looksLikeEmail = identifier.includes('@')
    const lookup = looksLikeEmail
      ? identifier.toLowerCase()
      : (normalizePhone(identifier) ?? identifier)

    const sb = createServerSupabase()

    // Resolve to a canonical email. Works for both email and phone identifiers.
    const { data: email, error: rpcErr } = await sb.rpc('get_email_for_login', { p_identifier: lookup })
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 })
    if (!email) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({ user: data.user, session: data.session })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Login failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

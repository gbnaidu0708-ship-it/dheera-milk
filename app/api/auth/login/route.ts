import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'
import { recordEvent } from '@/lib/audit'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Mobile required'),
  password:   z.string().min(1, 'Password required'),
})

function normalizePhone(input: string): string | null {
  const digits = input.replace(/^(\+91|91|0)/, '').replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? digits : null
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = schema.parse(await req.json())

    // Accept email OR phone for legacy accounts, but the simplified UX only
    // sends a phone. `get_email_for_login` returns the canonical email either way.
    const looksLikeEmail = identifier.includes('@')
    const lookup = looksLikeEmail
      ? identifier.toLowerCase()
      : (normalizePhone(identifier) ?? identifier)

    const sb = createServerSupabase()

    const { data: email, error: rpcErr } = await sb.rpc('get_email_for_login', { p_identifier: lookup })
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 })
    if (!email) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const { data: profile } = await sb
      .from('users')
      .select('id, role, name, mobile')
      .eq('auth_id', data.user.id)
      .single()

    if (profile) await recordEvent(sb, profile.id, 'login', { role: profile.role })

    return NextResponse.json({ user: data.user, session: data.session, profile })
  } catch (e: any) {
    const msg = e?.issues?.[0]?.message ?? e?.message ?? 'Login failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

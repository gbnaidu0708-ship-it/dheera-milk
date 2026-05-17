import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const store = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string)                                    { return store.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { try { store.set({ name, value, ...options }) } catch {} },
        remove(name: string, options: CookieOptions)         { try { store.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}

/** Helper: return authed user's DB profile or null */
export async function getProfile(supabase: ReturnType<typeof createServerSupabase>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
  return data
}

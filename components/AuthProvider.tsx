'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import type { DbUser } from '@/types'

type AuthContextValue = {
  user:    DbUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const profileQueryKey = (authId: string | null | undefined) =>
  ['profile', authId ?? null] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()

  const [session, setSession]                 = useState<Session | null>(null)
  const [sessionResolved, setSessionResolved] = useState(false)

  useEffect(() => {
    // getSupabase() is browser-only — defer construction to here so this
    // module is safe to evaluate during SSR/prerender (where the
    // NEXT_PUBLIC_* env vars may not be inlined yet).
    const sb = getSupabase()
    // supabase-js v2 emits INITIAL_SESSION on subscribe, so we don't need
    // a separate getSession() call.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setSessionResolved(true)
      if (event === 'SIGNED_OUT') {
        qc.removeQueries({ queryKey: ['profile'] })
      }
    })
    return () => subscription.unsubscribe()
  }, [qc])

  const authId = session?.user?.id ?? null

  const profile = useQuery({
    queryKey: profileQueryKey(authId),
    enabled:  !!authId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const sb = getSupabase()
      const { data, error } = await sb.from('users').select('*').eq('auth_id', authId!).single()
      if (error) throw error
      return data as DbUser
    },
  })

  const user = authId ? (profile.data ?? null) : null
  const loading = !sessionResolved || (!!authId && profile.isPending)

  const signOut = async () => {
    const sb = getSupabase()
    await sb.auth.signOut()
    // onAuthStateChange('SIGNED_OUT') clears session and removes the profile query.
  }

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signOut,
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

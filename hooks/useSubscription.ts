'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import type { DbSubscription, DbDelivery, DbInvoice } from '@/types'

const todayIso = () => new Date().toISOString().split('T')[0]

const keys = {
  subscription: (userId: string) => ['customer', 'subscription', userId] as const,
  today:        (userId: string) => ['customer', 'today',        userId, todayIso()] as const,
  invoices:     (userId: string) => ['customer', 'invoices',     userId] as const,
}

export function useSubscription(userId: string | null) {
  const qc = useQueryClient()
  const enabled = !!userId

  const subscriptionQ = useQuery({
    queryKey: enabled ? keys.subscription(userId!) : ['customer', 'subscription', null],
    enabled,
    queryFn: async () => {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as DbSubscription | null) ?? null
    },
  })

  const todayQ = useQuery({
    queryKey: enabled ? keys.today(userId!) : ['customer', 'today', null],
    enabled,
    queryFn: async () => {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('delivery_schedules')
        .select('*')
        .eq('user_id', userId!)
        .eq('delivery_date', todayIso())
        .maybeSingle()
      if (error) throw error
      return (data as DbDelivery | null) ?? null
    },
  })

  const invoicesQ = useQuery({
    queryKey: enabled ? keys.invoices(userId!) : ['customer', 'invoices', null],
    enabled,
    queryFn: async () => {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('invoices')
        .select('*, payments(*)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return (data ?? []) as DbInvoice[]
    },
  })

  // Realtime → invalidate the relevant queries. Browser-only.
  useEffect(() => {
    if (!userId) return
    const sb = getSupabase()
    const ch = sb.channel(`customer-rt-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_schedules', filter: `user_id=eq.${userId}` },
        () => { qc.invalidateQueries({ queryKey: keys.today(userId) }) })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
        () => { qc.invalidateQueries({ queryKey: keys.subscription(userId) }) })
      .subscribe()

    return () => { sb.removeChannel(ch) }
  }, [qc, userId])

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' | 'cancelled' }) => {
      const sb = getSupabase()
      const { error } = await sb.from('subscriptions').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      if (!userId) return
      qc.invalidateQueries({ queryKey: keys.subscription(userId) })
    },
  })

  return {
    subscription:  subscriptionQ.data ?? null,
    todayDelivery: todayQ.data ?? null,
    invoices:      invoicesQ.data ?? [],
    loading:       enabled && (subscriptionQ.isPending || todayQ.isPending || invoicesQ.isPending),
    pause:  (id: string) => setStatusMutation.mutateAsync({ id, status: 'paused'    }),
    resume: (id: string) => setStatusMutation.mutateAsync({ id, status: 'active'    }),
    cancel: (id: string) => setStatusMutation.mutateAsync({ id, status: 'cancelled' }),
    reload: () => {
      if (!userId) return
      qc.invalidateQueries({ queryKey: keys.subscription(userId) })
      qc.invalidateQueries({ queryKey: keys.today(userId) })
      qc.invalidateQueries({ queryKey: keys.invoices(userId) })
    },
  }
}

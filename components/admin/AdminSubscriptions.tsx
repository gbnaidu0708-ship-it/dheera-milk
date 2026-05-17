'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import { fmt, fmtDate } from '@/lib/constants'
import StatusBadge from '@/components/ui/StatusBadge'
import Card        from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

const SUBS_KEY = ['admin', 'subscriptions'] as const

export default function AdminSubscriptions() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all')

  const { data: subs = [], isPending } = useQuery({
    queryKey: SUBS_KEY,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('subscriptions')
        .select('*, user:users(name,mobile,area)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
  const loading = isPending

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await getSupabase().from('subscriptions').update({ status }).eq('id', id)
      if (error) throw error
      return status
    },
    onSuccess: (status) => {
      toast.success(`Subscription ${status}`)
      qc.invalidateQueries({ queryKey: SUBS_KEY })
    },
    onError: () => toast.error('Failed'),
  })
  const updateStatus = (id: string, status: string) => updateStatusMutation.mutate({ id, status })

  const EMOJIS: Record<string, string> = { cow: '🐄', buffalo: '🐃', a2: '🌾' }

  const counts = {
    all:       subs.length,
    active:    subs.filter(s => s.status === 'active').length,
    paused:    subs.filter(s => s.status === 'paused').length,
    cancelled: subs.filter(s => s.status === 'cancelled').length,
  }
  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-deep)' }}>Subscriptions</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{counts.active} active</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'paused', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={{ background: filter === f ? 'var(--blue)' : '#F0F4FF', color: filter === f ? '#fff' : 'var(--text-muted)' }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-4xl mb-3">🥛</p>
          <p className="font-bold" style={{ color: 'var(--blue-deep)' }}>No subscriptions found</p>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFF' }}>
                  {['Customer', 'Milk', 'Qty', 'Plan', 'Price/Day', 'Started', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const u = s.user as any
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid rgba(13,59,159,0.06)', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: 'var(--blue-deep)' }}>{u?.name ?? '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>+91 {u?.mobile}</p>
                      </td>
                      <td className="px-4 py-3 capitalize" style={{ color: 'var(--blue-deep)' }}>
                        {EMOJIS[s.milk_type] ?? '🥛'} {s.milk_type}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {s.quantity_ml >= 1000 ? `${s.quantity_ml / 1000}L` : `${s.quantity_ml}ml`}
                      </td>
                      <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-muted)' }}>{s.plan_type}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--green)' }}>{fmt(s.price_per_unit)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(s.start_date)}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <select
                          value={s.status}
                          onChange={e => updateStatus(s.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border outline-none cursor-pointer"
                          style={{ borderColor: 'var(--border)', color: 'var(--blue-deep)' }}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

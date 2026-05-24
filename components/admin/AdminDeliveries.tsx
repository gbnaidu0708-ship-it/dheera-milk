'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

export default function AdminDeliveries() {
  const today = new Date().toISOString().split('T')[0]
  const qc = useQueryClient()
  const [date,   setDate]   = useState(today)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'delivered' | 'skipped'>('all')

  const deliveriesKey = ['admin', 'deliveries', date] as const

  const { data: deliveries = [], isPending, refetch } = useQuery({
    queryKey: deliveriesKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('delivery_schedules')
        .select('*, user:users(name,mobile,address,area)')
        .eq('delivery_date', date)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
  const loading = isPending

  const callPatch = async (ids: string[], status: string) => {
    const res  = await fetch('/api/admin/deliveries', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ids, status }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed')
    return json.data
  }

  const markMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await callPatch([id], status)
      return { status }
    },
    onSuccess: ({ status }) => {
      toast.success(`Marked ${status}!`)
      qc.invalidateQueries({ queryKey: deliveriesKey })
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update'),
  })

  const markAllMutation = useMutation({
    mutationFn: async (pending: any[]) => {
      await callPatch(pending.map(d => d.id), 'delivered')
      return pending.length
    },
    onSuccess: (count) => {
      toast.success(`Marked ${count} deliveries as delivered!`)
      qc.invalidateQueries({ queryKey: deliveriesKey })
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update'),
  })

  const markStatus       = (id: string, status: string) => markMutation.mutate({ id, status })
  const markAllDelivered = () => {
    const pending = deliveries.filter(d => d.status === 'scheduled')
    if (!pending.length) { toast('No pending deliveries'); return }
    markAllMutation.mutate(pending)
  }
  const updatingId = markMutation.isPending ? markMutation.variables?.id ?? null : null

  const filtered = filter === 'all' ? deliveries : deliveries.filter(d => d.status === filter)
  const summary  = {
    total:     deliveries.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
    skipped:   deliveries.filter(d => d.status === 'skipped').length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-deep)' }}>Deliveries</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--border)' }} />
          <Button size="sm" onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',     val: summary.total,     bg: '#EAF4FF', color: '#082567' },
          { label: 'Delivered', val: summary.delivered, bg: '#D1FAE5', color: '#065F46' },
          { label: 'Pending',   val: summary.scheduled, bg: '#FFF3CD', color: '#856404' },
          { label: 'Skipped',   val: summary.skipped,   bg: '#F3F4F6', color: '#374151' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
            <p className="font-bold text-xl" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] font-semibold opacity-70" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + bulk action */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['all', 'scheduled', 'delivered', 'skipped'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={{ background: filter === f ? 'var(--blue)' : '#F0F4FF', color: filter === f ? '#fff' : 'var(--text-muted)' }}>
            {f === 'all' ? `All (${summary.total})` : f}
          </button>
        ))}
        {summary.scheduled > 0 && (
          <button
            onClick={markAllDelivered}
            className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--green)', color: '#fff' }}
          >
            ✅ Mark All Delivered
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold" style={{ color: 'var(--blue-deep)' }}>No deliveries for this date</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const u = d.user as any
            return (
              <Card key={d.id} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))' }}
                >
                  {u?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--blue-deep)' }}>{u?.name ?? 'Unknown'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    +91 {u?.mobile} · {u?.area ?? 'Whitefield'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {d.quantity_ml >= 1000 ? `${d.quantity_ml / 1000}L` : `${d.quantity_ml}ml`} Cow Milk
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={d.status} />
                  <div className="flex gap-1 flex-wrap justify-end">
                    {d.status !== 'delivered' && (
                      <button
                        disabled={updatingId === d.id}
                        onClick={() => markStatus(d.id, 'delivered')}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: '#D1FAE5', color: '#065F46' }}
                      >
                        {updatingId === d.id ? '…' : '✓ Delivered'}
                      </button>
                    )}
                    {d.status !== 'scheduled' && (
                      <button
                        disabled={updatingId === d.id}
                        onClick={() => markStatus(d.id, 'scheduled')}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                      >
                        ↺ Pending
                      </button>
                    )}
                    {d.status !== 'skipped' && (
                      <button
                        disabled={updatingId === d.id}
                        onClick={() => markStatus(d.id, 'skipped')}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: '#F3F4F6', color: '#374151' }}
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase'
import { PAUSE_DAYS_PER_MONTH, PAUSE_CUTOFF_HOUR } from '@/lib/constants'
import type { DbDelivery } from '@/types'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'

function pauseCutoffPassed(deliveryDate: string): boolean {
  const [y, m, d] = deliveryDate.split('-').map(Number)
  const prev      = new Date(Date.UTC(y, m - 1, d))
  prev.setUTCDate(prev.getUTCDate() - 1)
  const yy = prev.getUTCFullYear()
  const mm = String(prev.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(prev.getUTCDate()).padStart(2, '0')
  const cutoff = new Date(`${yy}-${mm}-${dd}T${String(PAUSE_CUTOFF_HOUR).padStart(2, '0')}:00:00+05:30`)
  return Date.now() >= cutoff.getTime()
}

const DOT: Record<string, string> = {
  delivered: '#10B981', scheduled: '#3B82F6', skipped: '#9CA3AF', failed: '#EF4444',
}

export default function DeliveryCalendar() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [month,    setMonth]    = useState(new Date())
  const [selected, setSelected] = useState<DbDelivery | null>(null)

  const start = format(startOfMonth(month), 'yyyy-MM-dd')
  const end   = format(endOfMonth(month),   'yyyy-MM-dd')

  const { data: schedules = [], isPending } = useQuery({
    queryKey: ['customer', 'schedules', user?.id ?? null, start, end],
    enabled:  !!user,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('delivery_schedules')
        .select('*')
        .eq('user_id', user!.id)
        .gte('delivery_date', start)
        .lte('delivery_date', end)
        .order('delivery_date')
      if (error) throw error
      return (data ?? []) as DbDelivery[]
    },
  })
  const loading = !!user && isPending

  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = startOfMonth(month).getDay()
  const getSched = (day: Date) => schedules.find(s => isSameDay(parseISO(s.delivery_date), day))

  const summary = {
    total:     schedules.length,
    delivered: schedules.filter(s => s.status === 'delivered').length,
    scheduled: schedules.filter(s => s.status === 'scheduled').length,
    skipped:   schedules.filter(s => s.status === 'skipped').length,
  }
  const pauseRemaining = Math.max(0, PAUSE_DAYS_PER_MONTH - summary.skipped)

  const pauseMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'unpause' }) => {
      const res  = await fetch('/api/deliveries/pause', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ delivery_id: id, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data as DbDelivery
    },
    onSuccess: (data, vars) => {
      toast.success(vars.action === 'pause' ? 'Delivery paused' : 'Delivery resumed')
      setSelected(data)
      qc.invalidateQueries({ queryKey: ['customer', 'schedules', user?.id ?? null] })
      qc.invalidateQueries({ queryKey: ['customer', 'today'] })
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed'),
  })

  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--blue-deep)' }}>
        Delivery Calendar
      </h1>

      {/* Month nav */}
      <div className="bg-white rounded-2xl flex items-center justify-between px-4 py-3 shadow-card border border-[var(--border)]">
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="text-2xl px-2 hover:opacity-60 transition-opacity">‹</button>
        <p className="font-bold" style={{ color: 'var(--blue-deep)' }}>{format(month, 'MMMM yyyy')}</p>
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="text-2xl px-2 hover:opacity-60 transition-opacity">›</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total',     val: summary.total,     bg: '#EAF4FF', color: '#082567' },
          { label: 'Delivered', val: summary.delivered, bg: '#D1FAE5', color: '#065F46' },
          { label: 'Upcoming',  val: summary.scheduled, bg: '#EFF6FF', color: '#1D4ED8' },
          { label: 'Skipped',   val: summary.skipped,   bg: '#F3F4F6', color: '#374151' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: s.bg }}>
            <p className="font-bold text-xl" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] font-semibold opacity-70" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {loading ? <SkeletonCard /> : (
        <Card className="!p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <p key={d} className="text-center text-[10px] font-bold py-1" style={{ color: 'var(--text-muted)' }}>{d}</p>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
            {days.map(day => {
              const sched   = getSched(day)
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => sched && setSelected(sched)}
                  className={`flex flex-col items-center py-1.5 rounded-lg transition-all ${sched ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} ${isToday ? 'ring-2 ring-[var(--blue)]' : ''}`}
                >
                  <span className="text-xs font-medium" style={{ color: isToday ? 'var(--blue)' : 'var(--text)' }}>
                    {format(day, 'd')}
                  </span>
                  {sched && (
                    <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: DOT[sched.status] ?? '#9CA3AF' }} />
                  )}
                </button>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3 pt-3 justify-center border-t" style={{ borderColor: 'var(--border)' }}>
            {Object.entries(DOT).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: v }} />
                <span className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{k}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pause-day budget hint */}
      <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
        Pauses left this month: <span className="font-semibold" style={{ color: 'var(--blue-deep)' }}>{pauseRemaining} / {PAUSE_DAYS_PER_MONTH}</span>
        {' · '}requests must be made before {PAUSE_CUTOFF_HOUR}:00 the previous day.
      </p>

      {/* Selected day detail */}
      {selected && (() => {
        const cutoffPassed = pauseCutoffPassed(selected.delivery_date)
        const canPause     = selected.status === 'scheduled' && !cutoffPassed && pauseRemaining > 0
        const canUnpause   = selected.status === 'skipped'   && !cutoffPassed
        return (
          <Card className="!border-[var(--blue)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold" style={{ color: 'var(--blue-deep)' }}>
                  📅 {format(parseISO(selected.delivery_date), 'dd MMM yyyy')}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {selected.quantity_ml >= 1000 ? `${selected.quantity_ml / 1000}L` : `${selected.quantity_ml}ml`} Cow Milk
                </p>
                {selected.delivered_at && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--green)' }}>
                    Delivered at {new Date(selected.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={selected.status} />
                <button onClick={() => setSelected(null)} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ Close</button>
              </div>
            </div>

            {(canPause || canUnpause) && (
              <div className="mt-3 flex gap-2">
                {canPause && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={pauseMutation.isPending}
                    onClick={() => pauseMutation.mutate({ id: selected.id, action: 'pause' })}
                  >
                    ⏸ Pause this day
                  </Button>
                )}
                {canUnpause && (
                  <Button
                    size="sm"
                    variant="success"
                    loading={pauseMutation.isPending}
                    onClick={() => pauseMutation.mutate({ id: selected.id, action: 'unpause' })}
                  >
                    ▶ Resume delivery
                  </Button>
                )}
              </div>
            )}
            {selected.status === 'scheduled' && cutoffPassed && (
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Cutoff passed — please contact support to change this delivery.
              </p>
            )}
            {selected.status === 'scheduled' && pauseRemaining === 0 && !cutoffPassed && (
              <p className="text-xs mt-3" style={{ color: '#B45309' }}>
                Monthly pause limit reached ({PAUSE_DAYS_PER_MONTH}).
              </p>
            )}
          </Card>
        )
      })()}
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

type Action = 'pause' | 'resume'
type Mode   = 'range' | 'month'

// Pause / resume dialog. Today can't be paused (cutoff already passed),
// so the minimum "from" is tomorrow.
export default function PauseDialog({
  open, onClose, subscriptionId,
}: {
  open: boolean
  onClose: () => void
  subscriptionId: string
}) {
  const qc = useQueryClient()

  const tomorrow = useMemo(() => {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return t.toISOString().split('T')[0]
  }, [])
  const today    = useMemo(() => new Date(), [])
  const todayStr = today.toISOString().split('T')[0]

  const [action, setAction] = useState<Action>('pause')
  const [mode,   setMode]   = useState<Mode>('range')
  const [from,   setFrom]   = useState(tomorrow)
  const [to,     setTo]     = useState(tomorrow)
  const [year,   setYear]   = useState(today.getFullYear())
  const [month,  setMonth]  = useState(today.getMonth() + 1)

  // For Resume only — convenience option that restores from today (or the
  // start of the selected month, whichever is later) through month-end.
  const monthBounds = (y: number, m: number) => {
    const f = `${y}-${String(m).padStart(2, '0')}-01`
    const t = new Date(Date.UTC(y, m, 0)).toISOString().split('T')[0]
    return { from: f, to: t }
  }

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const body = {
        subscription_id: subscriptionId,
        scope: mode === 'range'
          ? { type: 'range' as const, from, to }
          : { type: 'month' as const, year, month },
      }
      const res  = await fetch('/api/subscriptions/pause', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data as { skipped_count: number }
    },
    onSuccess: (data) => {
      toast.success(`Paused ${data.skipped_count} ${data.skipped_count === 1 ? 'day' : 'days'} ✅`)
      qc.invalidateQueries({ queryKey: ['customer'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to pause'),
  })

  const resumeMutation = useMutation({
    mutationFn: async (range: { from: string; to: string } | void) => {
      const body: any = { subscription_id: subscriptionId }
      const r = range
        ?? (mode === 'range'
              ? { from, to }
              : monthBounds(year, month))
      // Never restore days in the past — clamp from to today.
      body.from = r.from < todayStr ? todayStr : r.from
      body.to   = r.to
      const res  = await fetch('/api/subscriptions/resume', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data as { restored_count: number }
    },
    onSuccess: (data) => {
      toast.success(`Resumed ${data.restored_count} ${data.restored_count === 1 ? 'day' : 'days'} ▶`)
      qc.invalidateQueries({ queryKey: ['customer'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to resume'),
  })

  if (!open) return null

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString('en-IN', { month: 'long' }),
  }))
  const years = [today.getFullYear(), today.getFullYear() + 1]

  const isPause   = action === 'pause'
  // Both branches start the mutation using the current form values (range/month).
  const submit    = isPause ? () => pauseMutation.mutate() : () => resumeMutation.mutate()
  const pending   = isPause ? pauseMutation.isPending : resumeMutation.isPending
  const fromMin   = isPause ? tomorrow : todayStr

  const resumeRestOfMonth = () => {
    const t = new Date()
    const { to } = monthBounds(t.getFullYear(), t.getMonth() + 1)
    resumeMutation.mutate({ from: todayStr, to })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-md animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>
              ⏸ Manage deliveries
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Pauses start from tomorrow. Resume any previously-paused range.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Action toggle */}
        <div className="flex mb-4 rounded-xl p-1" style={{ background: 'var(--blue-light)' }}>
          {(['pause', 'resume'] as Action[]).map(a => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAction(a)
                setFrom(a === 'pause' ? tomorrow : todayStr)
                setTo(a === 'pause' ? tomorrow : todayStr)
              }}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize"
              style={{
                background: action === a ? '#fff' : 'transparent',
                color:      action === a ? 'var(--blue-deep)' : 'var(--text-muted)',
              }}
            >
              {a === 'pause' ? '⏸ Pause' : '▶ Resume'}
            </button>
          ))}
        </div>

        {/* Quick resume shortcut */}
        {!isPause && (
          <button
            onClick={resumeRestOfMonth}
            disabled={pending}
            className="w-full mb-4 py-2 rounded-xl text-sm font-semibold transition-all border"
            style={{ borderColor: 'var(--green)', color: 'var(--green)', background: 'var(--green-pale)' }}
          >
            ▶ Resume rest of current month
          </button>
        )}

        {/* Mode toggle */}
        <div className="flex mb-4 rounded-xl p-1" style={{ background: '#F4F6FA' }}>
          {(['range', 'month'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{
                background: mode === m ? '#fff' : 'transparent',
                color:      mode === m ? 'var(--blue-deep)' : 'var(--text-muted)',
              }}
            >
              {m === 'range' ? 'Select dates' : 'Whole month'}
            </button>
          ))}
        </div>

        {mode === 'range' ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                From
              </label>
              <input
                type="date"
                value={from}
                min={fromMin}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                To
              </label>
              <input
                type="date"
                value={to}
                min={from || fromMin}
                onChange={e => setTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Month
              </label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Year
              </label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button full loading={pending} onClick={submit}>
            {isPause ? 'Confirm pause' : 'Confirm resume'}
          </Button>
        </div>
      </div>
    </div>
  )
}

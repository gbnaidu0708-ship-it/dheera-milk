'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

type Mode = 'range' | 'month'

export default function PauseDialog({
  open, onClose, subscriptionId,
}: {
  open: boolean
  onClose: () => void
  subscriptionId: string
}) {
  const qc = useQueryClient()
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [mode,  setMode]  = useState<Mode>('range')
  const [from,  setFrom]  = useState(todayStr)
  const [to,    setTo]    = useState(todayStr)
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

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
      // Invalidate everything the home + calendar read so the UI updates instantly.
      qc.invalidateQueries({ queryKey: ['customer'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to pause'),
  })

  if (!open) return null

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString('en-IN', { month: 'long' }),
  }))
  const years = [today.getFullYear(), today.getFullYear() + 1]

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
              ⏸ Pause deliveries
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Skip selected days or the whole month. Past days can&apos;t be paused.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Mode toggle */}
        <div className="flex mb-4 rounded-xl p-1" style={{ background: 'var(--blue-light)' }}>
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
                min={todayStr}
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
                min={from || todayStr}
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
          <Button full loading={pauseMutation.isPending} onClick={() => pauseMutation.mutate()}>
            Confirm pause
          </Button>
        </div>
      </div>
    </div>
  )
}

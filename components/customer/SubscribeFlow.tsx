'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import {
  PRODUCTS,
  QTY_OPTIONS,
  QTY_CUSTOM_MIN_ML,
  QTY_CUSTOM_STEP_ML,
  QTY_MAX_ML,
  calcPrice,
  fmt,
} from '@/lib/constants'
import type { MilkType } from '@/types'
import Card   from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'

type QtyChoice = number | 'custom'

const STD_QTYS = QTY_OPTIONS.map(o => o.value)

export default function SubscribeFlow() {
  const { user, loading: authLoading } = useAuth()
  const { subscription, loading: subLoading } = useSubscription(user?.id ?? null)
  const router = useRouter()
  const qc = useQueryClient()

  const isModify = !!subscription
  const [ready, setReady] = useState(false)

  const [step,      setStep]      = useState(1)
  const [milkType,  setMilkType]  = useState<MilkType>('cow')
  const [qtyChoice, setQtyChoice] = useState<QtyChoice>(1000)
  const [customQty, setCustomQty] = useState<string>(String(QTY_CUSTOM_MIN_ML))
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading,   setLoading]   = useState(false)

  // Seed form from the active subscription when we're in modify mode.
  useEffect(() => {
    if (authLoading || subLoading) return
    if (subscription) {
      setMilkType(subscription.milk_type)
      if (STD_QTYS.includes(subscription.quantity_ml)) {
        setQtyChoice(subscription.quantity_ml)
      } else {
        setQtyChoice('custom')
        setCustomQty(String(subscription.quantity_ml))
      }
      setStartDate(subscription.start_date)
    }
    setReady(true)
  }, [authLoading, subLoading, subscription])

  const resolvedQty = qtyChoice === 'custom' ? Number(customQty) : qtyChoice
  const qtyValid =
    qtyChoice !== 'custom' ||
    (Number.isFinite(resolvedQty) &&
      resolvedQty >= QTY_CUSTOM_MIN_ML &&
      resolvedQty <= QTY_MAX_ML &&
      resolvedQty % QTY_CUSTOM_STEP_ML === 0)

  const price = qtyValid ? calcPrice(milkType, resolvedQty) : 0
  const qtyLabel = (ml: number) => (ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`)

  // Days from effective date through end of that calendar month (inclusive).
  // Used to show the prorated current-month total in the summary card.
  const remainingDaysInMonth = useMemo(() => {
    if (!startDate) return 0
    const [y, m, d] = startDate.split('-').map(Number)
    if (!y || !m || !d) return 0
    const last = new Date(y, m, 0).getDate()  // dynamic month length
    return Math.max(0, last - d + 1)
  }, [startDate])
  const monthEndLabel = useMemo(() => {
    if (!startDate) return ''
    const [y, m] = startDate.split('-').map(Number)
    const last   = new Date(y, m, 0)
    return last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }, [startDate])

  const unchanged = useMemo(() => {
    if (!subscription) return false
    return (
      subscription.milk_type === milkType &&
      subscription.quantity_ml === resolvedQty &&
      subscription.start_date === startDate
    )
  }, [subscription, milkType, resolvedQty, startDate])

  const todayStr = new Date().toISOString().split('T')[0]
  const startValid = startDate >= todayStr

  const modifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id:          subscription!.id,
          milk_type:   milkType,
          quantity_ml: resolvedQty,
          start_date:  startDate,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json.data
    },
    onSuccess: () => {
      toast.success('Subscription updated 🥛')
      // Cover both the home queries and the per-user subscription/today caches.
      qc.invalidateQueries({ queryKey: ['customer'] })
      router.push('/dashboard?upi=1')
    },
    onError: (e: any) => toast.error(e.message ?? 'Something went wrong'),
  })

  const createSubscription = async () => {
    if (!qtyValid) {
      toast.error(`Enter a quantity between ${QTY_CUSTOM_MIN_ML}ml and ${QTY_MAX_ML}ml in 500ml steps`)
      return
    }
    if (!startValid) {
      toast.error('Start date cannot be in the past')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/subscriptions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          milk_type:   milkType,
          quantity_ml: resolvedQty,
          plan_type:   'daily',
          start_date:  startDate,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success(`Subscribed! ${json.schedules_created} deliveries scheduled 🥛`)
      qc.invalidateQueries({ queryKey: ['customer'] })
      router.push('/dashboard?upi=1')
    } catch (e: any) {
      toast.error(e.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!startValid) {
      toast.error('Start date cannot be in the past')
      return
    }
    if (isModify) {
      if (unchanged) {
        toast('No changes to save', { icon: 'ℹ️' })
        return
      }
      modifyMutation.mutate()
    } else {
      createSubscription()
    }
  }

  if (authLoading || subLoading || !ready) {
    return (
      <div className="space-y-3">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    )
  }

  const submitting = loading || modifyMutation.isPending

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header + progress */}
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--blue-deep)' }}>
          {isModify ? 'Modify Subscription' : 'Monthly Subscription'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isModify
            ? 'Update your plan. Changes apply to future deliveries.'
            : 'Daily delivery, billed monthly. Pause anytime.'}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Step {step} of 3</p>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: s <= step ? 'var(--blue)' : 'var(--border)' }}
            />
          ))}
        </div>
      </div>

      {/* ── Step 1: Milk type ── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="font-bold" style={{ color: 'var(--blue-deep)' }}>Choose your milk</p>
          {PRODUCTS.map(p => (
            <Card
              key={p.id}
              className={`flex items-center gap-4 cursor-pointer transition-all ${milkType === p.id ? '!border-[var(--blue)] !bg-[var(--blue-light)]' : ''} ${!p.available ? 'opacity-50 !cursor-not-allowed' : ''}`}
              onClick={() => p.available && setMilkType(p.id as MilkType)}
            >
              <span className="text-4xl">{p.emoji}</span>
              <div className="flex-1">
                <p className="font-bold" style={{ color: 'var(--blue-deep)' }}>{p.name}</p>
                <p className="text-xs"  style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                {!p.available && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--blue-mid)' }}>Coming Soon</span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" style={{ color: 'var(--green)' }}>₹{p.pricePerLitre}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>per Litre</p>
              </div>
              {milkType === p.id && p.available && (
                <span className="text-[var(--blue)] text-xl">✓</span>
              )}
            </Card>
          ))}
          <Button full size="lg" onClick={() => setStep(2)}>Next →</Button>
        </div>
      )}

      {/* ── Step 2: Qty + start date ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="font-bold mb-2" style={{ color: 'var(--blue-deep)' }}>Quantity per delivery</p>
            <div className="grid grid-cols-2 gap-2">
              {QTY_OPTIONS.map(o => {
                const active = qtyChoice === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() => setQtyChoice(o.value)}
                    className="py-3 rounded-xl border-2 font-bold text-sm transition-all"
                    style={{
                      borderColor: active ? 'var(--blue)' : 'var(--border)',
                      background:  active ? 'var(--blue-light)' : '#fff',
                      color:       active ? 'var(--blue)' : 'var(--text-muted)',
                    }}
                  >
                    {o.label}
                  </button>
                )
              })}
              <button
                onClick={() => setQtyChoice('custom')}
                className="py-3 rounded-xl border-2 font-bold text-sm transition-all col-span-2"
                style={{
                  borderColor: qtyChoice === 'custom' ? 'var(--blue)' : 'var(--border)',
                  background:  qtyChoice === 'custom' ? 'var(--blue-light)' : '#fff',
                  color:       qtyChoice === 'custom' ? 'var(--blue)' : 'var(--text-muted)',
                }}
              >
                More than 2 litres
              </button>
            </div>
            {qtyChoice === 'custom' && (
              <div className="mt-3">
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Custom quantity (ml) · min {QTY_CUSTOM_MIN_ML}, in {QTY_CUSTOM_STEP_ML}ml steps
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={customQty}
                  min={QTY_CUSTOM_MIN_ML}
                  max={QTY_MAX_ML}
                  step={QTY_CUSTOM_STEP_ML}
                  onChange={e => setCustomQty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm"
                  style={{
                    borderColor: qtyValid ? 'var(--border)' : '#EF4444',
                    color: 'var(--text)',
                  }}
                />
                {!qtyValid && (
                  <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
                    Enter at least {QTY_CUSTOM_MIN_ML}ml in {QTY_CUSTOM_STEP_ML}ml increments.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="font-bold mb-2" style={{ color: 'var(--blue-deep)' }}>
              {isModify ? 'Effective from' : 'Start date'}
            </p>
            <input
              type="date"
              value={startDate}
              min={todayStr}
              onChange={e => {
                const v = e.target.value
                // Block manual entry of past dates — clamp to today.
                setStartDate(v && v < todayStr ? todayStr : v)
              }}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm"
              style={{
                borderColor: startValid ? 'var(--border)' : '#EF4444',
                color: 'var(--text)',
              }}
            />
            {!startValid && (
              <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
                Start date cannot be in the past.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button full onClick={() => qtyValid && startValid && setStep(3)} disabled={!qtyValid || !startValid}>Next →</Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Summary + confirm ── */}
      {step === 3 && (
        <div className="space-y-4">
          <Card style={{ background: 'var(--blue-light)', borderColor: 'var(--blue)' }}>
            <p className="font-bold text-lg mb-4" style={{ color: 'var(--blue-deep)' }}>📋 Order Summary</p>
            {[
              ['Milk Type',     milkType.charAt(0).toUpperCase() + milkType.slice(1) + ' Milk'],
              ['Quantity',      qtyLabel(resolvedQty)],
              ['Plan',          'Monthly (daily delivery)'],
              [isModify ? 'Effective From' : 'Start Date', startDate],
              ['Through',       monthEndLabel],
              ['Days this month', `${remainingDaysInMonth} day${remainingDaysInMonth === 1 ? '' : 's'}`],
              ['Price / Day',   fmt(price)],
              ['This month total', fmt(price * remainingDaysInMonth)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(13,59,159,0.1)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--blue-deep)' }}>{v}</span>
              </div>
            ))}
          </Card>

          <Card style={{ background: 'var(--green-pale)', borderColor: 'var(--green)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>
              🥛 Fresh milk delivered to your door by 6 AM, every day. Pause anytime from the home screen.
            </p>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
            <Button full loading={submitting} onClick={handleSubmit}>
              {isModify ? 'Save changes' : 'Confirm Subscription 🎉'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

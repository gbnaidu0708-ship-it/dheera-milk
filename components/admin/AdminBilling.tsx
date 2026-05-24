'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import { fmt, fmtDate, fmtMonth } from '@/lib/constants'
import type { DbInvoice, DbUser } from '@/types'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

const INVOICES_KEY  = ['admin', 'invoices']  as const
const CUSTOMERS_KEY = ['admin', 'customers'] as const

type Filter = 'all' | 'pending' | 'partial' | 'paid' | 'overdue'

export default function AdminBilling() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const todayStr = new Date().toISOString().split('T')[0]
  // Generate invoice
  const [genUser,  setGenUser]  = useState('')
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth() + 1))
  const [genYear,  setGenYear]  = useState(String(new Date().getFullYear()))
  // Record payment
  const [payInv,    setPayInv]    = useState<DbInvoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payTxn,    setPayTxn]    = useState('')

  const invoicesQ = useQuery({
    queryKey: INVOICES_KEY,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('invoices')
        .select('*, user:users(name,mobile), payments(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
  const customersQ = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('users')
        .select('id,name,mobile')
        .eq('role', 'customer')
        .eq('is_active', true)
      if (error) throw error
      return (data ?? []) as DbUser[]
    },
  })
  const invoices  = invoicesQ.data  ?? []
  const customers = customersQ.data ?? []
  const loading   = invoicesQ.isPending || customersQ.isPending

  const refreshInvoices = () => qc.invalidateQueries({ queryKey: INVOICES_KEY })

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res  = await fetch('/api/invoices', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: genUser, month: Number(genMonth), year: Number(genYear) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate')
    },
    onSuccess: () => { toast.success('Invoice generated! 📄'); refreshInvoices() },
    onError: (e: any) => toast.error(e.message ?? 'Failed to generate'),
  })

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const res  = await fetch('/api/payments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          invoice_id:     payInv!.id,
          amount:         Number(payAmount),
          payment_method: payMethod,
          transaction_id: payTxn || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
    },
    onSuccess: () => {
      toast.success('Payment recorded! 💰')
      setPayInv(null); setPayAmount(''); setPayTxn('')
      refreshInvoices()
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed'),
  })

  const generateInvoice = () => {
    if (!genUser) { toast.error('Select a customer'); return }
    generateInvoiceMutation.mutate()
  }
  const recordPayment = () => {
    if (!payInv || !payAmount) { toast.error('Enter amount'); return }
    recordPaymentMutation.mutate()
  }
  const generating = generateInvoiceMutation.isPending
  const paying     = recordPaymentMutation.isPending

  const isOverdue = (i: any) =>
    Number(i.pending_amount) > 0 && i.due_date && i.due_date < todayStr

  const filtered =
    filter === 'all'     ? invoices
    : filter === 'overdue' ? invoices.filter(isOverdue)
    :                       invoices.filter(i => i.payment_status === filter)

  const totalBilled    = invoices.reduce((s, i) => s + Number(i.total_amount),   0)
  const totalCollected = invoices.reduce((s, i) => s + Number(i.paid_amount),    0)
  const totalPending   = invoices.reduce((s, i) => s + Number(i.pending_amount), 0)
  const overdueCount   = invoices.filter(isOverdue).length

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-deep)' }}>Billing &amp; Invoices</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Billed', val: fmt(totalBilled),    bg: '#EAF4FF', color: '#082567' },
          { label: 'Collected',    val: fmt(totalCollected), bg: '#D1FAE5', color: '#065F46' },
          { label: 'Pending',      val: fmt(totalPending),   bg: '#FFF3CD', color: '#856404' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
            <p className="font-bold text-lg" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs font-semibold opacity-70" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Generate invoice */}
      <Card>
        <p className="font-bold mb-3" style={{ color: 'var(--blue-deep)' }}>📄 Generate Invoice</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={genUser} onChange={e => setGenUser(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm col-span-2 md:col-span-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name ?? c.mobile}</option>)}
          </select>
          <select value={genMonth} onChange={e => setGenMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--border)' }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('en', { month: 'short' })}
              </option>
            ))}
          </select>
          <input type="number" value={genYear} onChange={e => setGenYear(e.target.value)}
            min="2024" max="2030" className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--border)' }} />
          <Button loading={generating} onClick={generateInvoice} size="sm">Generate</Button>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'partial', 'paid', 'overdue'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={{ background: filter === f ? 'var(--blue)' : '#F0F4FF', color: filter === f ? '#fff' : 'var(--text-muted)' }}>
            {f === 'overdue' ? `Overdue (${overdueCount})` : f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFF' }}>
                  {['Invoice', 'Customer', 'Period', 'Total', 'Paid', 'Pending', 'Due', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const u  = inv.user as any
                  const od = isOverdue(inv)
                  return (
                    <tr key={inv.id} style={{ borderTop: '1px solid rgba(13,59,159,0.06)', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--blue-deep)' }}>{inv.invoice_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: 'var(--blue-deep)' }}>{u?.name ?? '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>+91 {u?.mobile}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{fmtMonth(inv.month, inv.year)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--blue-deep)' }}>{fmt(inv.total_amount)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--green)' }}>{fmt(inv.paid_amount)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: inv.pending_amount > 0 ? '#EF4444' : 'var(--green)' }}>{fmt(inv.pending_amount)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: od ? '#EF4444' : 'var(--text-muted)' }}>
                        {inv.due_date ? fmtDate(inv.due_date) : '—'}
                        {od && <span className="ml-1 font-bold">· overdue</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={od ? 'overdue' : inv.payment_status} /></td>
                      <td className="px-4 py-3">
                        {inv.pending_amount > 0 && (
                          <button
                            onClick={() => { setPayInv(inv); setPayAmount(String(inv.pending_amount)) }}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: '#D1FAE5', color: '#065F46' }}
                          >
                            + Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Revenue footer */}
          <div className="px-5 py-3 flex justify-end gap-6 text-sm font-semibold border-t" style={{ borderColor: 'rgba(13,59,159,0.08)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {invoices.length}</span>
            <span style={{ color: 'var(--green)' }}>Collected: {fmt(totalCollected)}</span>
          </div>
        </div>
      )}

      {/* Record payment modal */}
      {payInv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
          onClick={() => setPayInv(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>Record Payment</h3>
              <button onClick={() => setPayInv(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {payInv.invoice_number} · Pending: {fmt(payInv.pending_amount)}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: 'var(--border)' }}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>
              {payMethod !== 'cash' && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Transaction ID</label>
                  <input type="text" value={payTxn} onChange={e => setPayTxn(e.target.value)}
                    placeholder="UPI / Bank ref no." className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: 'var(--border)' }} />
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button full loading={paying} onClick={recordPayment}>Record Payment</Button>
                <Button variant="outline" onClick={() => setPayInv(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

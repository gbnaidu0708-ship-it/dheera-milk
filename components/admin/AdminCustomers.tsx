'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { fmtDate } from '@/lib/constants'
import Button     from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const qc = useQueryClient()
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)

  const { data, isPending, refetch } = useQuery({
    queryKey: ['admin', 'customers', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ search, page: String(page), limit: '15' })
      const res    = await fetch(`/api/customers?${params}`)
      const json   = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      return json as { data: any[]; count: number }
    },
    // Keep prior page visible while paginating to avoid flashes.
    placeholderData: prev => prev,
  })
  const customers = data?.data ?? []
  const total     = data?.count ?? 0
  const loading   = isPending

  const toggleActive = async (id: string, cur: boolean) => {
    const res = await fetch('/api/customers', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, is_active: !cur }),
    })
    if (res.ok) { toast.success('Updated!'); qc.invalidateQueries({ queryKey: ['admin', 'customers'] }) }
    else toast.error('Failed to update')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--blue-deep)' }}>Customers</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} total</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name or mobile…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          onKeyDown={e => e.key === 'Enter' && refetch()}
          className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <Button size="sm" onClick={() => refetch()}>Search</Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFF' }}>
                  {['Customer', 'Mobile', 'Area', 'Subscription', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid rgba(13,59,159,0.06)', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))' }}
                        >
                          {c.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--blue-deep)' }}>{c.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>+91 {c.mobile}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{c.area ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.subscriptions?.length
                        ? <StatusBadge status={c.subscriptions[0].status} />
                        : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>None</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.is_active ? 'active' : 'cancelled'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Link href={`/admin/customers/${c.id}`} title="View details"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:opacity-80"
                          style={{ background: '#EFF6FF', color: '#1D4ED8' }}>👁</Link>
                        <button
                          onClick={() => toggleActive(c.id, c.is_active)}
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                          style={{ background: c.is_active ? '#FEE2E2' : '#D1FAE5', color: c.is_active ? '#991B1B' : '#065F46' }}
                        >
                          {c.is_active ? '🚫' : '✅'}
                        </button>
                        <a href={`https://wa.me/91${c.mobile}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                          style={{ background: '#D1FAE5', color: '#065F46' }}>💬</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 flex justify-between items-center border-t" style={{ borderColor: 'rgba(13,59,159,0.08)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} · {total} customers</span>
            <div className="flex gap-2">
              <Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              <Button size="xs" variant="outline" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

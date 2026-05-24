'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import { UPI_ID, UPI_QR_PATH, fmt } from '@/lib/constants'

// Self-contained UPI panel: shows the QR code, the UPI ID with copy button,
// the "pay now or pay by month-end" note, and (optionally) the amount due.
export default function UpiPaymentCard({
  amount,
  compact = false,
  note,
}: {
  amount?: number
  compact?: boolean
  note?: string
}) {
  const [copied, setCopied] = useState(false)

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopied(true)
      toast.success('UPI ID copied')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <Card style={{ background: '#F0F9FF', borderColor: '#BAE6FD' }}>
      <div className={compact ? 'flex items-center gap-4' : 'space-y-3 text-center'}>
        <img
          src={UPI_QR_PATH}
          alt="UPI QR code"
          width={compact ? 96 : 200}
          height={compact ? 96 : 200}
          className={compact ? 'w-24 h-24 rounded-xl border' : 'mx-auto rounded-xl border'}
          style={{ borderColor: '#BAE6FD' }}
        />
        <div className={compact ? 'flex-1 min-w-0' : ''}>
          <p className="font-bold text-sm" style={{ color: '#075985' }}>💳 Pay via UPI</p>
          <button
            onClick={copyUpi}
            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all"
            style={{ background: '#fff', borderColor: '#BAE6FD', color: '#075985' }}
          >
            {UPI_ID} <span className="ml-1">{copied ? '✓' : '📋'}</span>
          </button>
          {typeof amount === 'number' && amount > 0 && (
            <p className="mt-2 text-sm font-semibold" style={{ color: '#0C4A6E' }}>
              Amount due: {fmt(amount)}
            </p>
          )}
          <p className={`mt-2 text-xs leading-relaxed ${compact ? '' : 'px-2'}`} style={{ color: '#0369A1' }}>
            {note ?? 'You can pay now or pay by the end of the current month.'}
          </p>
        </div>
      </div>
    </Card>
  )
}

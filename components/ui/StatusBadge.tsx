import { cn } from '@/lib/utils'

const MAP: Record<string, { bg: string; color: string; dot: string }> = {
  active:    { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  paused:    { bg: '#E0E7FF', color: '#3730A3', dot: '#6366F1' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  pending:   { bg: '#FFF3CD', color: '#856404', dot: '#F59E0B' },
  partial:   { bg: '#FFEDD5', color: '#9A3412', dot: '#F97316' },
  paid:      { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  overdue:   { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  scheduled: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  delivered: { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  skipped:   { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' },
  failed:    { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  completed: { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
}

export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = MAP[status] ?? { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' }
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full', className)}
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

import { cn } from '@/lib/utils'

interface Props {
  children:  React.ReactNode
  className?: string
  glass?:     boolean
  hover?:     boolean
  onClick?:   () => void
  style?:     React.CSSProperties
}

export default function Card({ children, className, glass, hover, onClick, style }: Props) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'rounded-2xl p-5',
        glass ? 'glass' : 'bg-white',
        'border border-[var(--border)] shadow-card',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

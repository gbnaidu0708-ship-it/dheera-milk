import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success' | 'whatsapp'
type Size    = 'xs' | 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  full?:    boolean
}

const V: Record<Variant, string> = {
  primary:  'bg-[var(--blue)]    text-white hover:bg-[var(--blue-deep)] focus:ring-[var(--blue)]    shadow-cta hover:shadow-cta-hover',
  outline:  'bg-white            text-[var(--blue)]  border-2 border-[var(--blue)]  hover:bg-[var(--blue-light)] focus:ring-[var(--blue)]',
  ghost:    'bg-transparent      text-[var(--text-muted)] hover:bg-gray-100 focus:ring-gray-300',
  danger:   'bg-red-500          text-white hover:bg-red-600 focus:ring-red-500',
  success:  'bg-[var(--green)]   text-white hover:bg-green-700 focus:ring-[var(--green)]',
  whatsapp: 'bg-[#25D366]        text-white hover:bg-[#1fb854] focus:ring-[#25D366]',
}
const S: Record<Size, string> = {
  xs: 'text-[11px] px-3   py-1.5 min-h-[32px]',
  sm: 'text-xs     px-4   py-2   min-h-[36px]',
  md: 'text-sm     px-5   py-3   min-h-[44px]',
  lg: 'text-base   px-8   py-3.5 min-h-[52px]',
}

export default function Button({ variant = 'primary', size = 'md', loading, full, children, className, disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'hover:-translate-y-[1px] active:scale-[0.98]',
        V[variant], S[size],
        full && 'w-full',
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}

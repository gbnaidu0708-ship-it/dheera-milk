import Image from 'next/image'
import { clsx } from 'clsx'

export const BRAND_IMG = '/dheera-brand.jpeg'

export function BrandBanner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden rounded-3xl border bg-white shadow-card',
        className,
      )}
      style={{ borderColor: 'var(--border)' }}
    >
      <Image
        src={BRAND_IMG}
        alt="Dheera Fresh Milk — Farm to Home Delivery"
        width={1200}
        height={800}
        priority
        sizes="(min-width: 1024px) 32rem, 100vw"
        className="w-full h-auto"
      />
    </div>
  )
}

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      className={clsx('inline-flex items-center gap-2', className)}
      style={{ lineHeight: 1 }}
    >
      <span
        className="inline-flex items-center justify-center rounded-lg text-white shrink-0"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))',
          fontSize: size * 0.55,
        }}
      >
        🥛
      </span>
      <span className="font-display font-extrabold" style={{ color: 'var(--blue-deep)' }}>
        Dheera <span style={{ color: 'var(--green)' }}>Fresh</span>
      </span>
    </span>
  )
}

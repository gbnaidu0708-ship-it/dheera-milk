import { cn } from '@/lib/utils'

interface Props {
  tag:      string
  title:    string
  subtitle: string
  center?:  boolean
  light?:   boolean
}

export default function SectionHeader({ tag, title, subtitle, center, light }: Props) {
  return (
    <div className={cn('reveal', center && 'text-center')}>
      <span
        className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-3"
        style={
          light
            ? { background: 'rgba(255,255,255,0.15)', color: '#fff' }
            : { background: 'var(--green-pale)', color: 'var(--green)' }
        }
      >
        {tag}
      </span>
      <h2
        className="font-display font-extrabold tracking-tight mb-3"
        style={{
          fontSize:     'clamp(28px, 4vw, 44px)',
          color:        light ? '#fff' : 'var(--blue-deep)',
          letterSpacing: '-1px',
        }}
      >
        {title}
      </h2>
      <p
        className={cn('text-[17px] leading-relaxed max-w-[520px]', center && 'mx-auto')}
        style={{ color: light ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
      >
        {subtitle}
      </p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRODUCTS } from '@/lib/constants'
import SectionHeader from '@/components/ui/SectionHeader'
import type { MilkProduct } from '@/types'

export default function Products() {
  return (
    <section
      id="products"
      className="py-24 px-[5%]"
      style={{ background: 'linear-gradient(180deg,#fff 0%,#EAF4FF 100%)' }}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tag="Our Products"
          title="Pure Dairy, Every Day"
          subtitle="From our farm to your home — fresh, natural, and full of goodness."
          center
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-14 reveal">
          {PRODUCTS.map(p =>
            p.available
              ? <ActiveCard    key={p.id} product={p} />
              : <ComingSoonCard key={p.id} product={p} />
          )}
        </div>
      </div>
    </section>
  )
}

function ActiveCard({ product }: { product: MilkProduct }) {
  const [qty, setQty] = useState(1)
  const router        = useRouter()
  const daily         = product.pricePerHalf * qty

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
      style={{ border: '1px solid rgba(13,59,159,0.08)', boxShadow: '0 2px 16px rgba(13,59,159,0.06)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(13,59,159,0.14)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(13,59,159,0.06)')}
    >
      <div className={`h-40 flex items-center justify-center text-[80px] bg-gradient-to-br ${product.bgClass}`}>
        {product.emoji}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="font-bold text-[17px] mb-1"   style={{ color: 'var(--blue-deep)' }}>{product.name}</p>
        <p className="text-[13px] leading-snug mb-3" style={{ color: 'var(--text-muted)' }}>{product.description}</p>
        <p className="font-display font-bold text-[22px] mb-1" style={{ color: 'var(--green)' }}>
          ₹{product.pricePerHalf}
          <span className="text-[13px] font-sans font-normal" style={{ color: 'var(--text-muted)' }}> / 500ml</span>
        </p>
        {qty > 1 && (
          <p className="text-[12px] mb-2 font-semibold" style={{ color: 'var(--green)' }}>
            Daily: ₹{daily}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <QtyBtn onClick={() => setQty(q => Math.max(1, q - 1))}>−</QtyBtn>
            <span className="font-bold text-[15px] w-4 text-center" style={{ color: 'var(--blue-deep)' }}>{qty}</span>
            <QtyBtn onClick={() => setQty(q => Math.min(10, q + 1))}>+</QtyBtn>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="text-xs font-bold text-white px-4 py-2 rounded-full hover:scale-105 transition-all"
            style={{ background: 'var(--blue)' }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  )
}

function QtyBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full border font-bold flex items-center justify-center transition-all"
      style={{ borderColor: 'var(--border)', color: 'var(--blue)' }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'var(--blue)'; el.style.color = '#fff'; el.style.borderColor = 'var(--blue)' }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#fff'; el.style.color = 'var(--blue)'; el.style.borderColor = 'rgba(13,59,159,0.12)' }}
    >
      {children}
    </button>
  )
}

function ComingSoonCard({ product }: { product: MilkProduct }) {
  return (
    <div
      className="bg-white rounded-3xl overflow-hidden flex flex-col"
      style={{ border: '1px solid rgba(13,59,159,0.08)', boxShadow: '0 2px 16px rgba(13,59,159,0.06)', opacity: 0.72 }}
    >
      <div className={`h-40 flex items-center justify-center text-[80px] bg-gradient-to-br ${product.bgClass}`} style={{ filter: 'grayscale(30%)' }}>
        {product.emoji}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2.5 border w-fit"
          style={{ background: '#F0F4FF', color: '#7A90C9', borderColor: '#D4DCFA' }}>
          Coming Soon
        </span>
        <p className="font-bold text-[17px] mb-1" style={{ color: 'var(--blue-deep)' }}>{product.name}</p>
        <p className="text-[13px] leading-snug"    style={{ color: 'var(--text-muted)' }}>{product.description}</p>
        <div className="flex items-center justify-between mt-auto pt-3.5">
          <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Available soon</span>
          <button disabled className="text-xs font-bold px-4 py-2 rounded-full cursor-not-allowed" style={{ background: '#E8EDF8', color: '#8A9CC4' }}>
            Notify Me
          </button>
        </div>
      </div>
    </div>
  )
}

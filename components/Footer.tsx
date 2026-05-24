'use client'

import { WHATSAPP_URL } from '@/lib/constants'

const COLS = [
  {
    title: 'Products',
    links: ['Cow Milk', 'Buffalo Milk', 'A2 Milk', 'Fresh Curd', 'Paneer'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Our Farm', 'Careers', 'Blog', 'Contact'],
  },
  {
    title: 'Support',
    links: ['Delivery Areas', 'Subscription FAQ', 'Pause Delivery', 'Refund Policy'],
  },
]

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 px-[5%]" style={{ background: 'var(--blue-deep)', color: '#fff' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div>
          <span className="font-display font-extrabold text-2xl block mb-4">
            Dheera <span style={{ color: 'var(--green-light)' }}>Fresh Milk</span>
          </span>
          <p className="text-sm leading-relaxed max-w-[260px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Pure, hygienic, farm-fresh dairy delivered to your doorstep every morning.
          </p>
          {/* Social */}
          <div className="flex gap-3 mt-5">
            {['📘', '📷', '🐦'].map((icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')}
              >
                {icon}
              </a>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              💬
            </a>
          </div>
        </div>

        {/* Link cols */}
        {COLS.map(col => (
          <div key={col.title}>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map(l => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.75)')}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          © {new Date().getFullYear()} Dheera Fresh Milk. All rights reserved.
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          📞 +91 96205 44988 &nbsp;|&nbsp; ✉️ hello@dheerafreshmilk.com &nbsp;|&nbsp; 🕕 Delivery: 5–7 AM daily
        </p>
      </div>
    </footer>
  )
}

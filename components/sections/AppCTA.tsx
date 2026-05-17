import { WHATSAPP_URL } from '@/lib/constants'

export default function AppCTA() {
  return (
    <section
      className="py-20 px-[5%] text-center"
      style={{ background: 'linear-gradient(135deg,var(--green-pale) 0%,var(--blue-light) 100%)' }}
    >
      <div className="max-w-xl mx-auto reveal">
        <div className="text-[64px] mb-5">💬</div>
        <h2
          className="font-display font-extrabold mb-3.5"
          style={{ fontSize: 'clamp(28px,4vw,42px)', color: 'var(--blue-deep)' }}
        >
          Order via WhatsApp — It&rsquo;s That Simple
        </h2>
        <p className="text-[17px] leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
          Just send us a message on WhatsApp to subscribe, modify or pause your daily delivery.
          No app needed right now — we keep it simple.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-bold transition-all hover:-translate-y-0.5"
          style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
        >
          <span className="text-[22px]">💬</span>
          <div className="text-left">
            <span className="block text-[10px] opacity-75 font-normal">Order &amp; Subscribe via</span>
            <span className="block text-[15px] font-bold">WhatsApp</span>
          </div>
        </a>
        <p className="mt-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          📱 App Store &amp; Google Play — <strong>coming soon</strong>
        </p>
      </div>
    </section>
  )
}

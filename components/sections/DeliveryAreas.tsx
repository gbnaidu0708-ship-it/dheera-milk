import SectionHeader from '@/components/ui/SectionHeader'
import { WHATSAPP_URL } from '@/lib/constants'

export default function DeliveryAreas() {
  return (
    <section id="delivery" className="py-24 px-[5%]" style={{ background: 'linear-gradient(135deg,#082567 0%,#0D3B9F 100%)' }}>
      <div className="max-w-6xl mx-auto text-center">
        <SectionHeader
          tag="Delivery Areas"
          title="We Deliver Near You"
          subtitle="Fresh milk delivered to Whitefield, Bengaluru. More zones coming soon."
          center light
        />
        <div className="flex flex-col items-center gap-4 mt-10 reveal">
          <div
            className="rounded-2xl px-10 py-8 max-w-xs w-full transition-all hover:-translate-y-1"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <div className="text-[40px] mb-2">📍</div>
            <p className="text-white font-bold text-[22px]">Whitefield, Bengaluru</p>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Delivery by 6:00 AM daily</p>
          </div>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            ✨ More areas coming soon —{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-2 hover:underline" style={{ color: 'rgba(255,255,255,0.85)' }}>
              notify me on WhatsApp
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

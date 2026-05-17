import { WHATSAPP_URL } from '@/lib/constants'

export default function WhatsAppFAB() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white transition-transform duration-200 hover:scale-110 md:bottom-6"
      style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.45)' }}
    >
      💬
    </a>
  )
}

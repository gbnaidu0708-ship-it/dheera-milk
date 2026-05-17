import Navbar        from '@/components/Navbar'
import Footer        from '@/components/Footer'
import Hero          from '@/components/sections/Hero'
import TrustStrip    from '@/components/sections/TrustStrip'
import Products      from '@/components/sections/Products'
import HowItWorks    from '@/components/sections/HowItWorks'
import DeliveryAreas from '@/components/sections/DeliveryAreas'
import Testimonials  from '@/components/sections/Testimonials'
import AppCTA        from '@/components/sections/AppCTA'
import WaveDivider   from '@/components/ui/WaveDivider'
import WhatsAppFAB   from '@/components/ui/WhatsAppFAB'
import RevealInit    from '@/components/ui/RevealInit'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Products />
        <WaveDivider fromColor="#EAF4FF" toColor="#ffffff"  direction="up"   />
        <HowItWorks />
        <WaveDivider fromColor="#ffffff"  toColor="#082567" direction="down"  />
        <DeliveryAreas />
        <WaveDivider fromColor="#082567"  toColor="#FFF8F0" direction="up"   />
        <Testimonials />
        <AppCTA />
      </main>
      <Footer />
      <WhatsAppFAB />
      <RevealInit />
    </>
  )
}

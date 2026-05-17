import SectionHeader from '@/components/ui/SectionHeader'

const STEPS = [
  { n: 1, icon: '📋', title: 'Choose Your Plan',  desc: 'Select product, quantity and schedule. Daily, alternate days, or custom dates.' },
  { n: 2, icon: '🚴', title: 'Daily Delivery',    desc: 'Our team collects fresh milk from the farm and delivers to your door by 6 AM.' },
  { n: 3, icon: '😊', title: 'Enjoy Fresh Milk',  desc: 'Wake up to pure, chilled milk every morning. Pause or cancel anytime.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-[5%] bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader tag="How It Works" title="Fresh Milk in 3 Simple Steps" subtitle="Getting farm-fresh dairy delivered has never been easier." center />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 mt-14 reveal">
          <div
            className="hidden md:block absolute pointer-events-none"
            style={{
              top:        '52px',
              left:       'calc(16.6% + 32px)',
              right:      'calc(16.6% + 32px)',
              height:     '2px',
              background: 'linear-gradient(90deg,var(--green-light),var(--blue))',
              borderRadius: '2px',
            }}
          />
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="flex justify-center mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 font-display font-extrabold text-[26px] text-white"
                  style={{ background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))', boxShadow: '0 8px 24px rgba(13,59,159,0.3)' }}
                >
                  {s.n}
                </div>
              </div>
              <div className="text-[36px] mb-3">{s.icon}</div>
              <h3 className="font-display font-bold text-[22px] mb-2" style={{ color: 'var(--blue-deep)' }}>{s.title}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

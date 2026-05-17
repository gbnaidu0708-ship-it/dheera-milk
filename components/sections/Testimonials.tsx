import SectionHeader from '@/components/ui/SectionHeader'

const REVIEWS = [
  { id: '1', name: 'Priya Ramesh',  loc: 'Whitefield, Bengaluru', init: 'PR', variant: 'blue',  text: "Best milk we've had in years! The difference in taste is incredible. My kids actually enjoy drinking milk now. Delivery is always on time." },
  { id: '2', name: 'Suresh Kumar',  loc: 'Whitefield, Bengaluru', init: 'SK', variant: 'green', text: 'The cow milk is exceptional. I can finally enjoy fresh milk without compromise. Truly farm-to-door quality.' },
  { id: '3', name: 'Anitha Murthy', loc: 'Whitefield, Bengaluru', init: 'AM', variant: 'blue',  text: "Same great quality every single morning. Worth every rupee. Highly recommend to every family!" },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-[5%]" style={{ background: 'var(--cream)' }}>
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tag="Customer Love"
          title="Families Trust Dheera"
          subtitle="Real reviews from real customers who've made the switch to farm-fresh."
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14 reveal">
          {REVIEWS.map(r => (
            <div
              key={r.id}
              className="rounded-[20px] p-7 transition-all hover:-translate-y-1"
              style={{
                background:    'linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))',
                backdropFilter:'blur(20px)',
                border:        '1px solid rgba(255,255,255,0.8)',
                boxShadow:     '0 8px 32px rgba(13,59,159,0.08)',
              }}
            >
              <div className="text-lg mb-3.5">⭐⭐⭐⭐⭐</div>
              <p className="text-[15px] leading-relaxed italic mb-5" style={{ color: 'var(--text-muted)' }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] text-white shrink-0"
                  style={{ background: r.variant === 'blue' ? 'linear-gradient(135deg,var(--blue),var(--blue-mid))' : 'linear-gradient(135deg,var(--green),var(--green-light))' }}
                >
                  {r.init}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--blue-deep)' }}>{r.name}</p>
                  <p className="text-xs"           style={{ color: 'var(--text-muted)' }}>{r.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

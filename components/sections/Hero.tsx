'use client'

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-[68px]"
      style={{
        background: 'linear-gradient(160deg,#EAF4FF 0%,#DAEEFF 30%,#EBF6E3 70%,#F0FFF4 100%)',
      }}
    >
      <div className="absolute inset-0 dot-pattern pointer-events-none" />

      <div className="relative max-w-6xl mx-auto w-full px-[5%] py-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* ── Left ── */}
        <div className="reveal">
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(30,142,62,0.1)',
              border:     '1px solid rgba(30,142,62,0.2)',
              color:      'var(--green)',
            }}
          >
            🌿 Now delivering in Whitefield, Bengaluru
          </div>

          <h1
            className="font-display font-extrabold leading-[1.08] mb-4"
            style={{ fontSize: 'clamp(40px,5vw,68px)', color: 'var(--blue-deep)', letterSpacing: '-1.5px' }}
          >
            Farm Fresh Milk
            <br />
            <em className="not-italic" style={{ color: 'var(--green)' }}>Delivered Daily</em>
          </h1>

          <p className="text-lg font-normal uppercase tracking-[4px] mb-8" style={{ color: 'var(--text-muted)' }}>
            Pure{' '}
            <span style={{ color: 'var(--green-light)', margin: '0 8px' }}>•</span>
            Hygienic{' '}
            <span style={{ color: 'var(--green-light)', margin: '0 8px' }}>•</span>
            Natural
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <a
              href="/auth"
              className="px-8 py-3.5 rounded-full text-base font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{
                background:  'linear-gradient(135deg,var(--blue),var(--blue-mid))',
                boxShadow:   '0 4px 24px rgba(13,59,159,0.3)',
              }}
            >
              Subscribe Now
            </a>
            <a
              href="#products"
              className="px-8 py-3.5 rounded-full text-base font-semibold bg-white transition-all hover:-translate-y-0.5"
              style={{ color: 'var(--blue)', border: '2px solid var(--blue)' }}
            >
              View Plans
            </a>
          </div>
        </div>

        {/* ── Right visual ── */}
        <div className="reveal hidden md:flex items-center justify-center">
          <div
            className="relative w-[390px] h-[390px] rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#EAF4FF,#D0EAFF)',
              border:     '2px solid rgba(13,59,159,0.08)',
            }}
          >
            <span
              className="text-[160px] animate-float"
              style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))' }}
            >
              🥛
            </span>

            {/* Floating cards */}
            <FloatCard pos="top-8 -left-4" delay="" iconBg="var(--green-pale)" icon="🌿" title="Farm Direct"      sub="No middlemen"  />
            <FloatCard pos="bottom-12 -right-4" delay="animate-float-card-d1" iconBg="var(--blue-light)" icon="⭐" title="4.9 Rating"   sub="Happy families" />
            <FloatCard pos="-right-10" midY delay="animate-float-card-d2" iconBg="var(--green-pale)" icon="🌿" title="No Preservatives" sub="100% natural"   />
          </div>
        </div>
      </div>
    </section>
  )
}

function FloatCard({
  pos, midY, delay, iconBg, icon, title, sub,
}: {
  pos: string; midY?: boolean; delay: string
  iconBg: string; icon: string; title: string; sub: string
}) {
  return (
    <div
      className={`absolute bg-white rounded-2xl px-4 py-3 flex items-center gap-2.5 ${delay || 'animate-float-card'} ${pos}`}
      style={{
        boxShadow: '0 8px 32px rgba(13,59,159,0.12)',
        ...(midY ? { top: '50%', transform: 'translateY(-50%)' } : {}),
      }}
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <p className="font-bold text-[14px]" style={{ color: 'var(--blue-deep)' }}>{title}</p>
        <p className="text-[11px]"           style={{ color: 'var(--text-muted)' }}>{sub}</p>
      </div>
    </div>
  )
}

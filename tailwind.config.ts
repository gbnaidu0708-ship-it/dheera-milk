import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:         '#0D3B9F',
          'blue-deep':  '#082567',
          'blue-mid':   '#2B5CE6',
          'blue-light': '#EAF4FF',
          green:        '#1E8E3E',
          'green-light':'#58B368',
          'green-pale': '#E6F5EB',
          cream:        '#FFF8F0',
          milk:         '#FAFAFA',
          text:         '#0A1628',
          muted:        '#4B5878',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        float:        'float 3s ease-in-out infinite',
        'float-card': 'floatCard 4s ease-in-out infinite',
        'fade-up':    'fadeUp 0.5s ease forwards',
        'slide-up':   'slideUp 0.3s ease forwards',
        shimmer:      'shimmer 1.5s infinite',
      },
      keyframes: {
        float:     { '0%,100%': { transform: 'translateY(0)' },   '50%': { transform: 'translateY(-14px)' } },
        floatCard: { '0%,100%': { transform: 'translateY(0)' },   '50%': { transform: 'translateY(-8px)' } },
        fadeUp:    { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(100%)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        card:        '0 2px 16px rgba(13,59,159,0.06)',
        'card-hover':'0 12px 40px rgba(13,59,159,0.14)',
        float:       '0 8px 32px rgba(13,59,159,0.12)',
        cta:         '0 4px 24px rgba(13,59,159,0.30)',
      },
    },
  },
  plugins: [],
}

export default config

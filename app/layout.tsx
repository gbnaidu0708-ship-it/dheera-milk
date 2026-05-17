import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/AuthProvider'
import QueryProvider from '@/components/QueryProvider'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'], weight: ['700', '800'],
  variable: '--font-playfair', display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'], weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans', display: 'swap',
})

export const metadata: Metadata = {
  title:       { default: 'Dheera Fresh Milk', template: '%s | Dheera Fresh Milk' },
  description: 'Pure, hygienic farm-fresh milk delivered daily to Whitefield, Bengaluru.',
  manifest:    '/manifest.json',
  keywords:    ['fresh milk', 'milk delivery', 'Whitefield', 'Bengaluru', 'farm fresh'],
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Dheera Fresh' },
  icons:       { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
  openGraph:   {
    title:       'Dheera Fresh Milk',
    description: 'Farm fresh milk delivered by 6 AM daily.',
    url:         'https://dheerafreshmilk.com',
    siteName:    'Dheera Fresh Milk',
    type:        'website',
  },
}

export const viewport: Viewport = {
  themeColor:   '#0D3B9F',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <meta name="mobile-web-app-capable"       content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon"              href="/icons/icon-192.png" />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background:   '#082567',
              color:        '#fff',
              borderRadius: '12px',
              fontSize:     '14px',
              fontFamily:   'var(--font-dm-sans)',
            },
          }}
        />
      </body>
    </html>
  )
}

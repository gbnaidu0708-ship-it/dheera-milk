import type { Metadata } from 'next'
import TopBar    from '@/components/customer/TopBar'
import BottomNav from '@/components/customer/BottomNav'

export const metadata: Metadata = { title: 'My Dashboard' }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <TopBar />
      <main className="max-w-lg mx-auto px-4 pt-20 pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

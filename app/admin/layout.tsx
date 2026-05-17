import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Admin – Dheera Fresh Milk' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <AdminSidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}

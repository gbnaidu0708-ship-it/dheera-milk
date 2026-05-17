import type { Metadata } from 'next'
import AuthForm from '@/components/auth/AuthForm'
import { BrandBanner } from '@/components/Brand'

export const metadata: Metadata = { title: 'Login' }

export default function AuthPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(160deg,#EAF4FF 0%,#DAEEFF 40%,#EBF6E3 100%)' }}
    >
      <div className="w-full max-w-sm">
        <BrandBanner className="mb-6" />

        <AuthForm />

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          <a href="/" className="hover:underline">← Back to website</a>
        </p>
      </div>
    </main>
  )
}

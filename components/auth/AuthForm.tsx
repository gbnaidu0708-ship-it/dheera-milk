'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getSupabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

type Mode = 'login' | 'signup'

export default function AuthForm() {
  const router = useRouter()
  const sb     = getSupabase()

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)

  // login fields
  const [identifier, setIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // signup fields
  const [name, setName]                     = useState('')
  const [email, setEmail]                   = useState('')
  const [phone, setPhone]                   = useState('')
  const [password, setPwd]                  = useState('')
  const [confirm, setConfirm]               = useState('')
  const [flatApartment, setFlatApartment]   = useState('')
  const [flatNumber, setFlatNumber]         = useState('')
  const [address, setAddress]               = useState('')

  const handleLogin = async () => {
    if (!identifier.trim() || !loginPassword) {
      toast.error('Enter email/phone and password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ identifier: identifier.trim(), password: loginPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Login failed')

      // Hydrate the browser client's session so middleware sees us on the next nav.
      if (json.session) {
        await sb.auth.setSession({
          access_token:  json.session.access_token,
          refresh_token: json.session.refresh_token,
        })
      }

      toast.success('Welcome back! 🥛')
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (
      !name.trim() || !email.trim() || !phone.trim() || !password ||
      !flatApartment.trim() || !flatNumber.trim() || !address.trim()
    ) {
      toast.error('Fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          name, email, phone, password,
          flat_apartment: flatApartment,
          flat_number:    flatNumber,
          address,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Signup failed')

      if (json.needs_confirmation) {
        toast.success('Account created. Check your email to confirm, then log in.')
        setMode('login')
        setIdentifier(email)
        return
      }

      if (json.session) {
        await sb.auth.setSession({
          access_token:  json.session.access_token,
          refresh_token: json.session.refresh_token,
        })
      }

      toast.success('Welcome to Dheera Fresh! 🥛')
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mode === 'login' ? handleLogin() : handleSignup()
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-[var(--border)]">
      <div className="flex mb-6 rounded-xl p-1" style={{ background: 'var(--blue-light)' }}>
        {(['login', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: mode === m ? '#fff' : 'transparent',
              color:      mode === m ? 'var(--blue-deep)' : 'var(--text-muted)',
              boxShadow:  mode === m ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {m === 'login' ? 'Login' : 'Sign Up'}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        {mode === 'login' ? (
          <>
            <Field
              label="Email or mobile number"
              value={identifier}
              onChange={setIdentifier}
              placeholder="you@example.com or 9876543210"
              autoFocus
            />
            <Field
              label="Password"
              type="password"
              value={loginPassword}
              onChange={setLoginPassword}
              placeholder="Your password"
            />
          </>
        ) : (
          <>
            <Field label="Full name" value={name} onChange={setName} placeholder="Your name" autoFocus />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Mobile number" type="tel" value={phone} onChange={setPhone} placeholder="10-digit mobile" />
            <Field
              label="Apartment / Society"
              value={flatApartment}
              onChange={setFlatApartment}
              placeholder="e.g. Prestige Lakeside Habitat"
            />
            <Field
              label="Flat number"
              value={flatNumber}
              onChange={setFlatNumber}
              placeholder="e.g. B-1204"
            />
            <Field
              label="Address / Landmark"
              value={address}
              onChange={setAddress}
              placeholder="Street, area, landmark"
            />
            <Field label="Password" type="password" value={password} onChange={setPwd} placeholder="At least 6 characters" />
            <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />
          </>
        )}

        <Button full loading={loading} size="lg" type="submit">
          {mode === 'login' ? 'Login' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        By continuing you agree to our Terms of Service
      </p>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoFocus?: boolean
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-3 text-base rounded-xl border bg-white"
        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      />
    </label>
  )
}

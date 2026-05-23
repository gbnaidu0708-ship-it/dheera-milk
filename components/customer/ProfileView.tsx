'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth, profileQueryKey } from '@/components/AuthProvider'
import { getSupabase } from '@/lib/supabase'
import { WHATSAPP_URL } from '@/lib/constants'
import Card   from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import toast  from 'react-hot-toast'

export default function ProfileView() {
  const { user, signOut, session } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()

  const [name,           setName]           = useState('')
  const [flatApartment,  setFlatApartment]  = useState('')
  const [flatNumber,     setFlatNumber]     = useState('')
  const [address,        setAddress]        = useState('')
  const [area,           setArea]           = useState('Whitefield')

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setFlatApartment(user.flat_apartment ?? '')
      setFlatNumber(user.flat_number ?? '')
      setAddress(user.address ?? '')
      setArea(user.area ?? 'Whitefield')
    }
  }, [user])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in')
      const sb = getSupabase()
      const { error } = await sb
        .from('users')
        .update({
          name,
          flat_apartment: flatApartment,
          flat_number:    flatNumber,
          address,
          area,
        })
        .eq('id', user.id)
      if (error) throw error
      // best-effort audit
      sb.from('user_events').insert({
        user_id:    user.id,
        event_type: 'profile_updated',
        metadata:   { name, flat_apartment: flatApartment, flat_number: flatNumber, area },
      }).then(() => {}, () => {})
    },
    onSuccess: () => {
      toast.success('Profile updated! ✅')
      qc.invalidateQueries({ queryKey: profileQueryKey(session?.user?.id ?? null) })
    },
    onError: () => toast.error('Failed to save profile'),
  })

  const save   = () => saveMutation.mutate()
  const saving = saveMutation.isPending

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const fields = [
    { label: 'Full Name',           value: name,          set: setName,          placeholder: 'Enter your name' },
    { label: 'Apartment / Society', value: flatApartment, set: setFlatApartment, placeholder: 'e.g. Prestige Lakeside Habitat' },
    { label: 'Flat Number',         value: flatNumber,    set: setFlatNumber,    placeholder: 'e.g. B-1204' },
    { label: 'Address / Landmark',  value: address,       set: setAddress,       placeholder: 'Street, area, landmark' },
    { label: 'Area',                value: area,          set: setArea,          placeholder: 'Whitefield' },
  ]

  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--blue-deep)' }}>
        My Profile
      </h1>

      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2"
          style={{ background: 'linear-gradient(135deg,var(--blue),var(--blue-mid))' }}
        >
          {user?.name?.[0]?.toUpperCase() ?? '🧑'}
        </div>
        <p className="font-bold text-lg" style={{ color: 'var(--blue-deep)' }}>
          {user?.name ?? 'Customer'}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>+91 {user?.mobile}</p>
      </div>

      {/* Edit form */}
      <Card>
        <p className="font-bold mb-4" style={{ color: 'var(--blue-deep)' }}>Personal Details</p>
        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {f.label}
              </label>
              <input
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Mobile (cannot be changed)
            </label>
            <input
              value={`+91 ${user?.mobile ?? ''}`}
              disabled
              className="w-full px-4 py-3 rounded-xl border text-sm bg-gray-50"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
        </div>
        <div className="mt-5">
          <Button full loading={saving} onClick={save}>Save Changes</Button>
        </div>
      </Card>

      {/* Contact / Support */}
      <Card style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
        <p className="font-bold mb-1" style={{ color: '#065F46' }}>Contact us</p>
        <p className="text-xs mb-3" style={{ color: '#047857' }}>
          Questions or support — message us on WhatsApp.
        </p>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="whatsapp" full>💬 Chat on WhatsApp · +91 96205 44988</Button>
        </a>
      </Card>

      {/* Logout */}
      <Card>
        <p className="font-bold mb-3" style={{ color: 'var(--blue-deep)' }}>Account</p>
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50"
          style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.25)' }}
        >
          🚪 Logout
        </button>
      </Card>
    </div>
  )
}

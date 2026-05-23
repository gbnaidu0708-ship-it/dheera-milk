import type { MilkProduct } from '@/types'

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919620544988'
export const WHATSAPP_URL    = `https://wa.me/${WHATSAPP_NUMBER}`
export const APP_NAME        = 'Dheera Fresh Milk'
export const APP_URL         = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dheerafreshmilk.com'

// Price per 1 litre (1000 ml) — the canonical pricing unit.
export const MILK_PRICE: Record<string, number> = {
  cow:     60,
  buffalo: 70,
  a2:      90,
}

export const PRODUCTS: MilkProduct[] = [
  {
    id: 'cow',
    name: 'Cow Milk',
    description: 'Light & nutritious, perfect for daily consumption',
    emoji: '🐄',
    bgClass: 'from-[#EAF4FF] to-[#D4EBFF]',
    pricePerLitre: 60,
    available: true,
  },
  {
    id: 'buffalo',
    name: 'Buffalo Milk',
    description: 'Rich & creamy, high fat content for chai lovers',
    emoji: '🐃',
    bgClass: 'from-[#EDE9FF] to-[#DDD5FF]',
    pricePerLitre: 70,
    available: false,
  },
  {
    id: 'a2',
    name: 'A2 Milk',
    description: 'Premium Desi cow milk, easier to digest',
    emoji: '🌾',
    bgClass: 'from-[#E6F5EB] to-[#CCF0D6]',
    pricePerLitre: 90,
    available: false,
  },
]

// Standard quantity choices for the monthly subscription. "More than 2L" is a
// custom path handled separately in the subscribe UI.
export const QTY_OPTIONS = [
  { label: '500 ml',     value: 500  },
  { label: '1 Litre',    value: 1000 },
  { label: '1.5 Litres', value: 1500 },
  { label: '2 Litres',   value: 2000 },
]
export const QTY_CUSTOM_MIN_ML = 2500   // minimum for the "More than 2 litre" path
export const QTY_CUSTOM_STEP_ML = 500
export const QTY_MAX_ML        = 20000  // matches the DB CHECK upper bound

// The MVP supports only a Monthly Subscription. Older 'alternate'/'custom'
// values remain in the schema for backward-compat with existing rows but are
// no longer offered in the UI; new subscriptions always write plan_type='daily'.
export const PAUSE_DAYS_PER_MONTH = 7
export const PAUSE_CUTOFF_HOUR    = 20  // 8 PM local time, previous day

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmt(amount: number) {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtMonth(month: number, year: number) {
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function calcPrice(milkType: string, quantityMl: number) {
  return (MILK_PRICE[milkType] ?? 60) * (quantityMl / 1000)
}

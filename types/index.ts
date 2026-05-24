// ─── Enums ────────────────────────────────────────────────────────────────────
export type Role           = 'customer' | 'admin' | 'delivery'
export type MilkType       = 'cow' | 'buffalo' | 'a2'
export type PlanType       = 'daily' | 'alternate' | 'custom'
export type SubStatus      = 'active' | 'paused' | 'cancelled'
export type DeliveryStatus = 'scheduled' | 'delivered' | 'skipped' | 'failed'
export type PaymentStatus  = 'pending' | 'partial' | 'paid' | 'overdue'
export type PaymentMethod  = 'upi' | 'cash' | 'razorpay' | 'bank_transfer'

// ─── Database rows ────────────────────────────────────────────────────────────
export interface DbUser {
  id:              string
  auth_id?:        string
  name:            string | null
  mobile:          string
  email:           string | null
  role:            Role
  flat_apartment:  string | null
  flat_number:     string | null
  address:         string | null
  area:            string | null
  pincode:         string | null
  whatsapp:        string | null
  is_active:       boolean
  created_at:      string
  updated_at:      string
}

export interface DbSubscription {
  id:             string
  user_id:        string
  milk_type:      MilkType
  quantity_ml:    number
  plan_type:      PlanType
  start_date:     string
  end_date:       string | null
  status:         SubStatus
  price_per_unit: number
  route_id:       string | null
  notes:          string | null
  created_at:     string
  updated_at:     string
  // joined
  user?:          DbUser
}

export interface DbDelivery {
  id:              string
  subscription_id: string
  user_id:         string
  delivery_date:   string
  quantity_ml:     number
  status:          DeliveryStatus
  delivered_at:    string | null
  notes:           string | null
  created_at:      string
  // joined
  subscription?:   DbSubscription
  user?:           DbUser
}

export interface DbInvoice {
  id:               string
  user_id:          string
  invoice_number:   string
  month:            number
  year:             number
  total_deliveries: number
  total_liters:     number
  total_amount:     number
  paid_amount:      number
  pending_amount:   number
  payment_status:   PaymentStatus
  due_date:         string | null
  created_at:       string
  updated_at:       string
  // joined
  user?:            DbUser
  payments?:        DbPayment[]
}

export interface DbPayment {
  id:             string
  invoice_id:     string
  user_id:        string
  payment_method: PaymentMethod
  transaction_id: string | null
  amount:         number
  payment_date:   string
  status:         'pending' | 'completed' | 'failed' | 'refunded'
  notes:          string | null
  created_at:     string
}

export interface DbRoute {
  id:           string
  route_name:   string
  delivery_boy: string | null
  area:         string
  pincode:      string | null
  is_active:    boolean
  created_at:   string
}

// ─── UI-only types ────────────────────────────────────────────────────────────
export interface MilkProduct {
  id:            MilkType
  name:          string
  description:   string
  emoji:         string
  bgClass:       string
  pricePerLitre: number
  available:     boolean
}

export interface AdminStats {
  total_customers:     number
  active_subscriptions:number
  today_deliveries:    number
  today_delivered:     number
  month_deliveries:    number
  month_delivered:     number
  month_upcoming:      number
  month_skipped:       number
  monthly_revenue:     number
  pending_payments:    number
}

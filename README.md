# 🥛 Dheera Fresh Milk — Production Web App

Full-stack milk delivery subscription platform built with **Next.js 14 App Router**, **Supabase**, **TypeScript**, **Tailwind CSS**, and **PWA**.

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up Supabase database
#    → Open https://itrlzyphwqzmxaatyxea.supabase.co
#    → SQL Editor → New Query
#    → Paste contents of supabase/migrations/001_schema.sql
#    → Click Run ▶

# 3. (Already done) .env.local is pre-configured with your credentials

# 4. Start development
npm run dev
# → Open http://localhost:3000
```

---

## 🔐 Make Yourself Admin

After logging in once with your mobile number (+91 9620544988), run in Supabase SQL Editor:

```sql
UPDATE public.users SET role = 'admin' WHERE mobile = '9620544988';
```

Then visit **http://localhost:3000/admin**

---

## 📁 Complete Project Structure

```
dheera-fresh-milk/
│
├── app/                              # Next.js App Router pages
│   ├── page.tsx                      # Public landing page
│   ├── layout.tsx                    # Root layout (PWA + fonts)
│   ├── globals.css                   # CSS variables + animations
│   │
│   ├── auth/page.tsx                 # Mobile OTP login
│   │
│   ├── dashboard/                    # Customer portal (auth protected)
│   │   ├── layout.tsx                # TopBar + BottomNav
│   │   ├── page.tsx                  # Home: today's delivery, subscription
│   │   ├── subscribe/page.tsx        # 3-step subscription wizard
│   │   ├── deliveries/page.tsx       # Interactive delivery calendar
│   │   ├── billing/page.tsx          # Invoices + PDF download
│   │   └── profile/page.tsx          # Edit name/address
│   │
│   ├── admin/                        # Admin panel (admin role only)
│   │   ├── layout.tsx                # Sidebar layout
│   │   ├── page.tsx                  # Stats dashboard
│   │   ├── customers/page.tsx        # Search, manage, WhatsApp
│   │   ├── subscriptions/page.tsx    # View + update status
│   │   ├── deliveries/page.tsx       # Mark delivered/skipped + bulk action
│   │   └── billing/page.tsx          # Generate invoices + record payments
│   │
│   └── api/                          # REST API routes
│       ├── auth/send-otp/            # POST: send OTP
│       ├── auth/verify-otp/          # POST: verify + create session
│       ├── subscriptions/            # GET/POST/PATCH
│       ├── deliveries/               # GET/PATCH
│       ├── invoices/                 # GET/POST
│       ├── payments/                 # GET/POST
│       ├── customers/                # GET/PATCH (admin)
│       └── admin/dashboard/          # GET: stats (admin)
│
├── components/
│   ├── Navbar.tsx                    # Auth-aware top nav
│   ├── Footer.tsx                    # Full footer
│   │
│   ├── sections/                     # Landing page sections
│   │   ├── Hero.tsx
│   │   ├── TrustStrip.tsx
│   │   ├── Products.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── DeliveryAreas.tsx
│   │   ├── Testimonials.tsx
│   │   └── AppCTA.tsx
│   │
│   ├── auth/
│   │   └── OTPForm.tsx               # Full OTP login flow
│   │
│   ├── customer/
│   │   ├── TopBar.tsx                # Fixed top bar
│   │   ├── BottomNav.tsx             # Mobile bottom navigation
│   │   ├── CustomerHome.tsx          # Dashboard home
│   │   ├── SubscribeFlow.tsx         # 3-step subscription wizard
│   │   ├── DeliveryCalendar.tsx      # Month calendar with dots
│   │   ├── BillingView.tsx           # Invoices + jsPDF download
│   │   └── ProfileView.tsx           # Edit profile
│   │
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHome.tsx             # Stats + quick links
│   │   ├── AdminCustomers.tsx        # Table + modal + search
│   │   ├── AdminDeliveries.tsx       # Mark deliveries + bulk
│   │   ├── AdminSubscriptions.tsx    # View + change status
│   │   └── AdminBilling.tsx          # Generate + record payments
│   │
│   └── ui/
│       ├── Button.tsx                # 5 variants, loading state
│       ├── Card.tsx                  # glass / hover variants
│       ├── StatusBadge.tsx           # 12 status colours
│       ├── Skeleton.tsx              # Loading skeletons
│       ├── WaveDivider.tsx           # SVG wave separator
│       ├── WhatsAppFAB.tsx           # Floating WhatsApp button
│       ├── RevealInit.tsx            # Scroll reveal observer
│       └── SectionHeader.tsx         # Reusable section heading
│
├── hooks/
│   ├── useAuth.ts                    # Session + user profile
│   └── useSubscription.ts            # Realtime subscription data
│
├── lib/
│   ├── supabase.ts                   # Browser client (singleton)
│   ├── supabase-server.ts            # Server client for API routes
│   ├── constants.ts                  # Products, prices, formatters
│   └── utils.ts                      # cn() utility
│
├── types/index.ts                    # All TypeScript types
├── middleware.ts                     # Route protection + admin gate
│
├── supabase/migrations/
│   └── 001_schema.sql                # Full DB schema with RLS
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   └── icons/                        # Add icon-192.png, icon-512.png
│
├── .env.local                        # Pre-configured credentials
├── next.config.js                    # PWA + image domains
├── tailwind.config.ts                # Brand tokens
└── vercel.json                       # Vercel deploy config
```

---

## 🗄 Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Customer + admin profiles (linked to auth.users) |
| `subscriptions` | Milk delivery subscriptions |
| `delivery_schedules` | Daily delivery slots (auto-generated 30 days) |
| `invoices` | Monthly billing records |
| `payments` | Payment transactions |
| `delivery_routes` | Delivery areas and delivery boys |

All tables have **Row Level Security (RLS)** — customers see only their own data.

---

## 🌐 Deploy to Vercel

```bash
# Option A: GitHub
# 1. Push to GitHub
# 2. Import at vercel.com/new
# 3. Add environment variables in Vercel dashboard

# Option B: Vercel CLI
npm install -g vercel
vercel --prod
```

**Environment variables to add in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=https://itrlzyphwqzmxaatyxea.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Dl_wP744yti7Vt7y2VzCKg_FhPKdUh3
NEXT_PUBLIC_APP_URL=https://dheerafreshmilk.com
NEXT_PUBLIC_WHATSAPP_NUMBER=919620544988
```

---

## 📱 PWA – Android Install

1. Open `https://dheerafreshmilk.com` in Chrome on Android
2. Tap ⋮ menu → "Add to Home Screen"
3. App installs and works offline

**Add PWA icons** — place these files in `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

You can generate them free at https://favicon.io or https://maskable.app

---

## 🔑 Key URLs

| URL | Description |
|-----|-------------|
| `/` | Public landing page |
| `/auth` | Mobile OTP login |
| `/dashboard` | Customer home |
| `/dashboard/subscribe` | Subscribe to milk |
| `/dashboard/deliveries` | Delivery calendar |
| `/dashboard/billing` | Invoices + payments |
| `/admin` | Admin dashboard |
| `/admin/deliveries` | Mark deliveries |
| `/admin/billing` | Generate invoices |

---

## 🔜 Roadmap

- [ ] Razorpay online payment
- [ ] WhatsApp Business API automated reminders
- [ ] Push notifications (FCM)
- [ ] More delivery areas
- [ ] Buffalo Milk & A2 Milk launch
- [ ] Delivery staff mobile panel

---

**Contact:** +91 96205 44988 · hello@dheerafreshmilk.com

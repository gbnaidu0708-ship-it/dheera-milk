# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Next.js dev server at http://localhost:3000 (PWA disabled in dev)
npm run build       # Production build (also runs next-pwa to generate service worker)
npm run start       # Serve production build
npm run lint        # next lint (eslint-config-next)
npm run type-check  # tsc --noEmit — strict TS check, no tests in this repo
```

There is no test suite. `type-check` and `lint` are the only verification gates.

The `@/*` path alias maps to the repo root (see `tsconfig.json`).

## Required env vars (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_WHATSAPP_NUMBER=...
```

The app uses **only the anon key** on both client and server — there is no service-role key. All authorization is enforced by Supabase Row Level Security (see "Auth model" below). Do not introduce a service-role client without explicit reason.

## Architecture

Next.js 14 **App Router** + Supabase (Postgres + Auth + Realtime) + Tailwind. PWA via `next-pwa` (build-time only).

### Auth model — three layers, all consistent

1. **Supabase Auth** issues a session via mobile-OTP (`auth.signInWithOtp({ phone, channel: 'sms' })`). The auth user lives in `auth.users`.
2. **App profile** lives in `public.users`, joined to `auth.users` via `auth_id`. `role` is one of `customer | admin | delivery` and is the authorization source of truth.
3. **`middleware.ts`** is the route gate. It runs on `/dashboard/:path*`, `/admin/:path*`, `/auth` (see `config.matcher`):
   - unauthenticated + protected route → `/auth`
   - authenticated + `/auth` → `/dashboard`
   - `/admin/*` requires `public.users.role = 'admin'` (queried per request)

Inside API routes, **never trust the client for identity**. Use `createServerSupabase()` then `getProfile(sb)` from `lib/supabase-server.ts` to get the DB profile, and scope all queries by `profile.id`. RLS policies in `supabase/migrations/001_schema.sql` enforce the same boundary at the database level via the `is_admin()` SECURITY DEFINER function and `own_*` / `admin_*` policy pairs on every table — so if you bypass the profile check in app code, RLS still blocks cross-user reads.

When adding a new table, follow the existing pattern: enable RLS, add an `own_<x>` policy scoped by `user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())` and an `admin_<x>` policy using `is_admin()`.

### Three Supabase client factories — pick the right one

- `lib/supabase.ts` → `getSupabase()`: browser singleton via `createBrowserClient`. Use in `'use client'` components and hooks.
- `lib/supabase-server.ts` → `createServerSupabase()`: per-request server client via `createServerClient` reading from `next/headers` cookies. Use in API routes and server components. Pair with `getProfile()` to resolve the DB user.
- `middleware.ts` constructs its own `createServerClient` because middleware uses a different cookie API (mutating both request and response). Do not refactor this to call `createServerSupabase()` — the cookie plumbing differs.

### Data flow for subscriptions → deliveries

`POST /api/subscriptions` is the canonical example of the write path:

1. Validate body with zod.
2. Compute `price_per_unit` server-side from `MILK_PRICE` (in `lib/constants.ts`) — never trust client-supplied price.
3. Insert the subscription.
4. **Auto-generate a 30-day `delivery_schedules` batch** based on `plan_type` (`daily` / `alternate` / `custom`). The schedule rows are what the admin marks delivered/skipped and what billing aggregates over.

`delivery_schedules` has a `UNIQUE(subscription_id, delivery_date)` constraint, so re-inserts for the same day will fail — design new schedule-generation code accordingly.

`subscriptions` and `delivery_schedules` are published to `supabase_realtime`; the customer dashboard subscribes to live updates via `hooks/useSubscription.ts`.

### Pricing

Single source of truth: `MILK_PRICE` in `lib/constants.ts` (price per 500 ml). `calcPrice(milkType, quantityMl)` is the only allowed pricing function — duplicate it nowhere. The API route recomputes price server-side on insert.

### Layout split

- `app/dashboard/layout.tsx` — customer shell (TopBar + BottomNav).
- `app/admin/layout.tsx` — admin shell (Sidebar). Middleware has already gated this.
- `app/layout.tsx` — root layout, PWA manifest, fonts, global providers.

Each layout's children are full pages; the heavy UI lives in `components/customer/*` and `components/admin/*` so the route files stay thin.

## Database schema cheatsheet

Full SQL in `supabase/migrations/001_schema.sql`. Key relationships:

- `users.auth_id → auth.users.id` (the only bridge to Supabase Auth)
- `subscriptions.user_id → users.id`, `subscriptions.route_id → delivery_routes.id`
- `delivery_schedules.subscription_id → subscriptions.id` (cascades), also denormalizes `user_id` for fast RLS
- `invoices` has `UNIQUE(user_id, month, year)` and a generated `pending_amount = total_amount - paid_amount`
- `invoice_number` auto-formats as `DFM-YYYYMM-0001` via the `invoice_seq` sequence

To promote a user to admin, run `UPDATE public.users SET role = 'admin' WHERE mobile = '...'` in the Supabase SQL Editor — there is no admin UI for this.

## Conventions

- API routes return `{ data }` on success and `{ error: string }` with an appropriate status on failure. Match this shape when adding routes.
- Validate all request bodies with `zod`.
- TypeScript is `strict: true`. Database row types live in `types/index.ts` as `Db<Entity>` interfaces — extend these rather than redefining shapes inline.
- Tailwind brand tokens are in `tailwind.config.ts`; prefer them over hard-coded colors.

-- ============================================================
-- Dheera Fresh Milk – Full Database Schema + RLS
-- Paste into Supabase SQL Editor and click Run
-- ============================================================

-- gen_random_uuid() is built into Postgres 13+; no extension required.

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  mobile      TEXT        UNIQUE NOT NULL,
  email       TEXT,
  role        TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','delivery')),
  address     TEXT,
  area        TEXT,
  pincode     TEXT,
  whatsapp    TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DELIVERY ROUTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_routes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name    TEXT        NOT NULL,
  delivery_boy  TEXT,
  area          TEXT        NOT NULL,
  pincode       TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milk_type      TEXT        NOT NULL CHECK (milk_type IN ('cow','buffalo','a2')),
  quantity_ml    INTEGER     NOT NULL CHECK (quantity_ml IN (500,1000,2000)),
  plan_type      TEXT        NOT NULL CHECK (plan_type IN ('daily','alternate','custom')),
  start_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  end_date       DATE,
  status         TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  price_per_unit NUMERIC(8,2) NOT NULL DEFAULT 60.00,
  route_id       UUID        REFERENCES public.delivery_routes(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DELIVERY SCHEDULES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_schedules (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID        NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delivery_date    DATE        NOT NULL,
  quantity_ml      INTEGER     NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','delivered','skipped','failed')),
  delivered_at     TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, delivery_date)
);

-- ─── INVOICES ───────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE TABLE IF NOT EXISTS public.invoices (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number   TEXT        UNIQUE NOT NULL DEFAULT ('DFM-' || TO_CHAR(NOW(),'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_seq')::TEXT,4,'0')),
  month            INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INTEGER     NOT NULL,
  total_deliveries INTEGER     NOT NULL DEFAULT 0,
  total_liters     NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_amount   NUMERIC(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  payment_status   TEXT        NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','overdue')),
  due_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- ─── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID        NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_method  TEXT        NOT NULL CHECK (payment_method IN ('upi','cash','razorpay','bank_transfer')),
  transaction_id  TEXT,
  amount          NUMERIC(10,2) NOT NULL,
  payment_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT        NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUTO updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER users_upd         BEFORE UPDATE ON public.users         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_upd BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_upd      BEFORE UPDATE ON public.invoices      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_auth   ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile);
CREATE INDEX IF NOT EXISTS idx_sub_user     ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_status   ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_del_date     ON public.delivery_schedules(delivery_date);
CREATE INDEX IF NOT EXISTS idx_del_user     ON public.delivery_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_user     ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_inv      ON public.payments(invoice_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_routes    ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

-- users
CREATE POLICY "own_user"    ON public.users FOR ALL USING (auth_id = auth.uid());
CREATE POLICY "admin_users" ON public.users FOR ALL USING (is_admin());

-- subscriptions
CREATE POLICY "own_sub"    ON public.subscriptions FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "admin_sub"  ON public.subscriptions FOR ALL USING (is_admin());

-- delivery_schedules
CREATE POLICY "own_del"    ON public.delivery_schedules FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "admin_del"  ON public.delivery_schedules FOR ALL USING (is_admin());

-- invoices
CREATE POLICY "own_inv"    ON public.invoices FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "admin_inv"  ON public.invoices FOR ALL USING (is_admin());

-- payments
CREATE POLICY "own_pay"    ON public.payments FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "admin_pay"  ON public.payments FOR ALL USING (is_admin());

-- delivery_routes: anyone can read
CREATE POLICY "routes_read"  ON public.delivery_routes FOR SELECT USING (true);
CREATE POLICY "admin_routes" ON public.delivery_routes FOR ALL    USING (is_admin());

-- ─── REALTIME ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- ─── SEED ───────────────────────────────────────────────────
INSERT INTO public.delivery_routes (route_name, delivery_boy, area, pincode)
VALUES ('Whitefield Route 1', 'Raju Kumar', 'Whitefield', '560066')
ON CONFLICT DO NOTHING;

-- ─── MAKE YOURSELF ADMIN ────────────────────────────────────
-- Run this AFTER logging in once (your mobile must be in the users table):
-- UPDATE public.users SET role = 'admin' WHERE mobile = '9620544988';

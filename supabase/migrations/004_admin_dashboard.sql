-- ============================================================
-- Admin dashboard support
--   1. user_events      — audit log of every meaningful customer action
--   2. super-admin seed — mobile 9620544988 / password superadmin123
--   3. realtime publication for user_events
-- Idempotent: safe to re-run.
-- ============================================================

-- pgcrypto is needed for crypt() / gen_salt() in the super-admin seed below.
-- Default on Supabase but explicit is safer.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. user_events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user    ON public.user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_type    ON public.user_events(event_type);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events; admins can read everything.
DROP POLICY IF EXISTS "own_events_insert" ON public.user_events;
CREATE POLICY "own_events_insert"
  ON public.user_events FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "own_events_read" ON public.user_events;
CREATE POLICY "own_events_read"
  ON public.user_events FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "admin_events" ON public.user_events;
CREATE POLICY "admin_events"
  ON public.user_events FOR ALL
  USING (is_admin());

-- Optional realtime stream for the admin dashboard. Guarded so re-running
-- the migration doesn't error on "relation is already member of publication".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_events';
  END IF;
END $$;

-- ─── 2. Super-admin seed ───────────────────────────────────
-- Hard-resets the 9620544988 account: drops any prior auth.users + public.users
-- row for that mobile/email, then creates a fresh admin (password superadmin123).
-- ON DELETE CASCADE on subscriptions/deliveries/invoices/payments will clean
-- up the customer's history along with the profile row.
DO $$
DECLARE
  v_mobile   TEXT := '9620544988';
  v_email    TEXT := '9620544988@dfm.local';
  v_password TEXT := 'superadmin123';
  v_auth_id  UUID;
BEGIN
  -- 1. Delete any existing public.users row for this mobile (cascades to
  --    subscriptions / deliveries / invoices / payments / user_events).
  DELETE FROM public.users WHERE mobile = v_mobile;

  -- 2. Delete any leftover auth.users row for the synthetic email OR with
  --    matching mobile in user metadata. Cascades to public.users via auth_id FK,
  --    but step 1 already covered the common case.
  DELETE FROM auth.users
   WHERE email = v_email
      OR raw_user_meta_data ->> 'mobile' = v_mobile;

  -- 3. Recreate the auth user with a fresh bcrypt password.
  v_auth_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_auth_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('mobile', v_mobile),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- 4. Matching profile row with role = 'admin'.
  INSERT INTO public.users (auth_id, mobile, email, role, name)
  VALUES (v_auth_id, v_mobile, v_email, 'admin', 'Super Admin');
END $$;

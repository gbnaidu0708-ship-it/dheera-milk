-- ============================================================
-- Move from phone-OTP auth to email-or-phone + password auth
-- ============================================================

-- Allow email-or-phone login: email must be unique (phone already is).
-- Existing rows may have NULL email, so a partial unique index is safest.
DROP INDEX IF EXISTS idx_users_email_unique;
CREATE UNIQUE INDEX idx_users_email_unique
  ON public.users (LOWER(email))
  WHERE email IS NOT NULL;

-- Helper used by /api/auth/login: given either an email or a 10-digit mobile,
-- return the canonical email so we can call signInWithPassword({ email, password }).
-- SECURITY DEFINER so it bypasses RLS (caller is unauthenticated at login time).
-- Returns NULL if no match — never reveals which side (email vs phone) matched.
CREATE OR REPLACE FUNCTION public.get_email_for_login(p_identifier TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.users
  WHERE email IS NOT NULL
    AND (LOWER(email) = LOWER(p_identifier) OR mobile = p_identifier)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_email_for_login(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_for_login(TEXT) TO anon, authenticated;

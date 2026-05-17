-- ============================================================
-- MVP corrections per claude/product.md
--   1. Mandatory address fields on registration:
--        - flat_apartment (apartment / society name)
--        - flat_number    (door / flat no)
--      (existing `address` column reused for street / landmark line)
--   2. Relax the quantity_ml CHECK so we can support 500 / 1000 / 1500 / 2000
--      and customer-entered "more than 2 litre" values.
-- ============================================================

-- ─── users: new address fields ─────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS flat_apartment TEXT,
  ADD COLUMN IF NOT EXISTS flat_number    TEXT;

-- ─── subscriptions: allow flexible quantity ────────────────
-- The original CHECK was `quantity_ml IN (500,1000,2000)`. The new product
-- spec adds 1500 and a "More than 2 litre" custom value, so we widen the
-- constraint to any positive multiple-of-500 quantity, with a sane upper
-- bound to catch typos.
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_quantity_ml_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_quantity_ml_check
  CHECK (quantity_ml >= 500 AND quantity_ml <= 20000 AND quantity_ml % 500 = 0);

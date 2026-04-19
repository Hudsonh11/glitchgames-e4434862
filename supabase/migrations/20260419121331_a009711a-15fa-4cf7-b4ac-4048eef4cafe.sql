
-- Prevent duplicate completion of the same Stripe session
CREATE UNIQUE INDEX IF NOT EXISTS battle_pass_purchases_stripe_session_unique
  ON public.battle_pass_purchases (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Allow service-role inserts (edge function uses service role; RLS is bypassed,
-- but we add an explicit policy so any future authenticated path is blocked).
-- No INSERT policy exists today, which is intentional — keep it that way for clients.
-- (No-op SQL block for clarity.)
SELECT 1;

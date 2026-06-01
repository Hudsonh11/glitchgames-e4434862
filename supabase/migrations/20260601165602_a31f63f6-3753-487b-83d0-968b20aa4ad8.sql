-- Glitch Games Plus subscription system
CREATE TABLE public.plus_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'cancelled'
  source TEXT NOT NULL DEFAULT 'purchase', -- 'purchase' | 'admin_gift'
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 499,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_id TEXT,
  granted_by UUID, -- admin user_id when source = 'admin_gift'
  last_reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plus_subs_user ON public.plus_subscriptions(user_id);
CREATE INDEX idx_plus_subs_active ON public.plus_subscriptions(user_id, status, expires_at);

GRANT SELECT ON public.plus_subscriptions TO authenticated;
GRANT ALL ON public.plus_subscriptions TO service_role;

ALTER TABLE public.plus_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own plus subs"
  ON public.plus_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all plus subs"
  ON public.plus_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage plus subs"
  ON public.plus_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_plus_subs_updated_at
  BEFORE UPDATE ON public.plus_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Weekly mystery crate claims (Plus perk)
CREATE TABLE public.plus_loot_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  gems_awarded INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

GRANT SELECT, INSERT ON public.plus_loot_claims TO authenticated;
GRANT ALL ON public.plus_loot_claims TO service_role;

ALTER TABLE public.plus_loot_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own loot claims"
  ON public.plus_loot_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own loot claims"
  ON public.plus_loot_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper function: is the user currently a Plus member?
CREATE OR REPLACE FUNCTION public.is_plus_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plus_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;
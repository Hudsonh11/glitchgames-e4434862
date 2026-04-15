
CREATE TABLE public.battle_pass_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT UNIQUE,
  season TEXT NOT NULL DEFAULT 'season_1',
  amount_cents INTEGER NOT NULL DEFAULT 499,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_pass_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
ON public.battle_pass_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_battle_pass_purchases_updated_at
BEFORE UPDATE ON public.battle_pass_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

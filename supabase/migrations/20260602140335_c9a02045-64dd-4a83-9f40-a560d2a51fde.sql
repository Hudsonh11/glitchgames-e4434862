ALTER TABLE public.plus_subscriptions ADD COLUMN IF NOT EXISTS revoked_by uuid;
ALTER TABLE public.plus_subscriptions ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS priority_support boolean NOT NULL DEFAULT false;
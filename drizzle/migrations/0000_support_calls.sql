CREATE TABLE public.support_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.support_agents TO authenticated;
GRANT ALL ON public.support_agents TO service_role;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_support_agent(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = _user_id)
$$;

CREATE POLICY "View own or admin" ON public.support_agents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add agents" ON public.support_agents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove agents" ON public.support_agents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.support_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text,
  agent_id uuid,
  agent_name text,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.support_calls TO authenticated;
GRANT ALL ON public.support_calls TO service_role;
ALTER TABLE public.support_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties and agents view calls" ON public.support_calls FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR agent_id = auth.uid()
    OR (status = 'waiting' AND public.is_support_agent(auth.uid()))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users start own calls" ON public.support_calls FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'waiting' AND agent_id IS NULL);
CREATE POLICY "Parties and agents update calls" ON public.support_calls FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR agent_id = auth.uid()
    OR (status = 'waiting' AND agent_id IS NULL AND public.is_support_agent(auth.uid())))
  WITH CHECK (user_id = auth.uid() OR (agent_id = auth.uid() AND public.is_support_agent(auth.uid())));

ALTER TABLE public.support_calls REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_calls;
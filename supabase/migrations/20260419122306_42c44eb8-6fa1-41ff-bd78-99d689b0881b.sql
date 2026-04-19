ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_pass_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER TABLE public.battle_pass_purchases REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
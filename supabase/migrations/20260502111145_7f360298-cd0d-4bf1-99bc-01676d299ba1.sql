
-- CLANS
CREATE TABLE public.clans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Authenticated can create clans" ON public.clans FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update clan" ON public.clans FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete clan" ON public.clans FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.clan_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id),
  UNIQUE(user_id)
);
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clans" ON public.clan_members FOR DELETE USING (auth.uid() = user_id);

-- Clan chat (restricted to members)
CREATE TABLE public.clan_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clan_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view clan chat" ON public.clan_chat FOR SELECT
USING (EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_chat.clan_id AND cm.user_id = auth.uid()));
CREATE POLICY "Members can post in clan chat" ON public.clan_chat FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_chat.clan_id AND cm.user_id = auth.uid()));

-- FOLLOWERS
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- PARTY LOBBIES
CREATE TABLE public.party_lobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  max_players INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.party_lobbies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lobbies" ON public.party_lobbies FOR SELECT USING (true);
CREATE POLICY "Users can create lobbies" ON public.party_lobbies FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update lobby" ON public.party_lobbies FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete lobby" ON public.party_lobbies FOR DELETE USING (auth.uid() = host_id);

CREATE TABLE public.party_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.party_lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lobby_id, user_id)
);
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view party members" ON public.party_members FOR SELECT USING (true);
CREATE POLICY "Users can join party" ON public.party_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave party" ON public.party_members FOR DELETE USING (auth.uid() = user_id);

-- TOURNAMENTS
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  game_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  max_participants INTEGER NOT NULL DEFAULT 16,
  prize_coins INTEGER NOT NULL DEFAULT 1000,
  prize_gems INTEGER NOT NULL DEFAULT 50,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins manage tournaments" ON public.tournaments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can join tournament" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON public.tournament_participants FOR UPDATE USING (auth.uid() = user_id);

-- SCHEDULED MAINTENANCE
CREATE TABLE public.scheduled_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view maintenance" ON public.scheduled_maintenance FOR SELECT USING (true);
CREATE POLICY "Admins manage maintenance" ON public.scheduled_maintenance FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- GAME CONFIG
CREATE TABLE public.game_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  difficulty TEXT NOT NULL DEFAULT 'normal',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view game config" ON public.game_config FOR SELECT USING (true);
CREATE POLICY "Admins manage game config" ON public.game_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Realtime for clan chat & lobbies
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_members;

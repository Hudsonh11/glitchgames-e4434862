
-- 1. Per-game achievement definitions
CREATE TABLE public.game_achievement_defs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  achievement_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  tier text NOT NULL DEFAULT 'bronze',
  goal_type text NOT NULL DEFAULT 'score',
  goal_target integer NOT NULL DEFAULT 1,
  reward_coins integer NOT NULL DEFAULT 50,
  reward_gems integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_achievement_defs TO anon, authenticated;
GRANT ALL ON public.game_achievement_defs TO service_role;
ALTER TABLE public.game_achievement_defs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gad_read" ON public.game_achievement_defs FOR SELECT USING (true);
CREATE POLICY "gad_admin" ON public.game_achievement_defs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 2. Leaderboard seasons + hall of fame
CREATE TABLE public.leaderboard_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leaderboard_seasons TO anon, authenticated;
GRANT ALL ON public.leaderboard_seasons TO service_role;
ALTER TABLE public.leaderboard_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ls_read" ON public.leaderboard_seasons FOR SELECT USING (true);
CREATE POLICY "ls_admin" ON public.leaderboard_seasons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.leaderboard_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.leaderboard_seasons(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  score integer NOT NULL,
  rank integer NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leaderboard_archive TO anon, authenticated;
GRANT ALL ON public.leaderboard_archive TO service_role;
ALTER TABLE public.leaderboard_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "la_read" ON public.leaderboard_archive FOR SELECT USING (true);
CREATE POLICY "la_admin" ON public.leaderboard_archive FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. XP milestones
CREATE TABLE public.xp_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL UNIQUE,
  title text NOT NULL,
  reward_coins integer NOT NULL DEFAULT 0,
  reward_gems integer NOT NULL DEFAULT 0,
  reward_border text,
  reward_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.xp_milestones TO anon, authenticated;
GRANT ALL ON public.xp_milestones TO service_role;
ALTER TABLE public.xp_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xm_read" ON public.xp_milestones FOR SELECT USING (true);
CREATE POLICY "xm_admin" ON public.xp_milestones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_milestone_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level integer NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);
GRANT SELECT, INSERT ON public.user_milestone_claims TO authenticated;
GRANT ALL ON public.user_milestone_claims TO service_role;
ALTER TABLE public.user_milestone_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "umc_own_read" ON public.user_milestone_claims FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "umc_own_insert" ON public.user_milestone_claims FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 4. Replays / ghosts
CREATE TABLE public.game_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  score integer NOT NULL,
  frames jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_replays TO authenticated;
GRANT SELECT ON public.game_replays TO anon;
GRANT ALL ON public.game_replays TO service_role;
ALTER TABLE public.game_replays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gr_read" ON public.game_replays FOR SELECT USING (true);
CREATE POLICY "gr_own_write" ON public.game_replays FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Game of the day
CREATE TABLE public.game_of_the_day (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL UNIQUE,
  game_id text NOT NULL,
  reward_multiplier numeric NOT NULL DEFAULT 2.0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_of_the_day TO anon, authenticated;
GRANT ALL ON public.game_of_the_day TO service_role;
ALTER TABLE public.game_of_the_day ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gotd_read" ON public.game_of_the_day FOR SELECT USING (true);
CREATE POLICY "gotd_admin" ON public.game_of_the_day FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. Direct challenges: extend existing table
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '3 days'),
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE DEFAULT encode(gen_random_bytes(9),'hex'),
  ADD COLUMN IF NOT EXISTS message text;

-- 7. Clan wars
CREATE TABLE public.clan_wars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  clan_a uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  clan_b uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  prize_coins integer NOT NULL DEFAULT 5000,
  winner_clan uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, clan_a, clan_b)
);
GRANT SELECT ON public.clan_wars TO anon, authenticated;
GRANT ALL ON public.clan_wars TO service_role;
ALTER TABLE public.clan_wars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cw_read" ON public.clan_wars FOR SELECT USING (true);
CREATE POLICY "cw_admin" ON public.clan_wars FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.clan_war_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.clan_wars(id) ON DELETE CASCADE,
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.clan_war_contributions TO authenticated;
GRANT ALL ON public.clan_war_contributions TO service_role;
ALTER TABLE public.clan_war_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cwc_read" ON public.clan_war_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "cwc_own_insert" ON public.clan_war_contributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 8. Spectating: live match sessions
CREATE TABLE public.match_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  game_id text NOT NULL,
  status text NOT NULL DEFAULT 'live',
  allow_spectators boolean NOT NULL DEFAULT true,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  spectator_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.match_sessions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.match_sessions TO authenticated;
GRANT ALL ON public.match_sessions TO service_role;
ALTER TABLE public.match_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_read" ON public.match_sessions FOR SELECT USING (allow_spectators = true OR host_id = auth.uid());
CREATE POLICY "ms_host_write" ON public.match_sessions FOR ALL TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
ALTER TABLE public.match_sessions REPLICA IDENTITY FULL;

-- 9. Emotes / reactions
CREATE TABLE public.match_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.match_sessions(id) ON DELETE CASCADE,
  target_user_id uuid,
  user_id uuid NOT NULL,
  emote text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.match_reactions TO authenticated;
GRANT SELECT ON public.match_reactions TO anon;
GRANT ALL ON public.match_reactions TO service_role;
ALTER TABLE public.match_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_read" ON public.match_reactions FOR SELECT USING (true);
CREATE POLICY "mr_own_insert" ON public.match_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
ALTER TABLE public.match_reactions REPLICA IDENTITY FULL;

-- 10. Plus monthly cosmetic drops
CREATE TABLE public.plus_cosmetic_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  border_id text,
  title_id text,
  theme_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plus_cosmetic_drops TO anon, authenticated;
GRANT ALL ON public.plus_cosmetic_drops TO service_role;
ALTER TABLE public.plus_cosmetic_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcd_read" ON public.plus_cosmetic_drops FOR SELECT USING (true);
CREATE POLICY "pcd_admin" ON public.plus_cosmetic_drops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.plus_drop_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  drop_id uuid NOT NULL REFERENCES public.plus_cosmetic_drops(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, drop_id)
);
GRANT SELECT, INSERT ON public.plus_drop_claims TO authenticated;
GRANT ALL ON public.plus_drop_claims TO service_role;
ALTER TABLE public.plus_drop_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pdc_own" ON public.plus_drop_claims FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "pdc_own_insert" ON public.plus_drop_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_plus_active(auth.uid()));

-- 11. Plus gifting between players
CREATE TABLE public.plus_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid,
  recipient_username text,
  status text NOT NULL DEFAULT 'pending',
  redeem_code text NOT NULL UNIQUE DEFAULT upper(encode(gen_random_bytes(6),'hex')),
  message text,
  stripe_session_id text,
  amount_cents integer NOT NULL DEFAULT 799,
  currency text NOT NULL DEFAULT 'gbp',
  created_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.plus_gifts TO authenticated;
GRANT ALL ON public.plus_gifts TO service_role;
ALTER TABLE public.plus_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pg_read" ON public.plus_gifts FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "pg_insert" ON public.plus_gifts FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "pg_update" ON public.plus_gifts FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- 12. Tournament brackets
CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  slot integer NOT NULL,
  player_a uuid,
  player_b uuid,
  score_a integer,
  score_b integer,
  winner_id uuid,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round, slot)
);
GRANT SELECT ON public.tournament_matches TO anon, authenticated;
GRANT INSERT, UPDATE ON public.tournament_matches TO authenticated;
GRANT ALL ON public.tournament_matches TO service_role;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_read" ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "tm_player_update" ON public.tournament_matches FOR UPDATE TO authenticated
  USING (player_a = auth.uid() OR player_b = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "tm_admin_insert" ON public.tournament_matches FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 13. Modifier leaderboards
CREATE TABLE public.modifier_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  modifier text NOT NULL,
  high_score integer NOT NULL DEFAULT 0,
  runs integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id, modifier)
);
GRANT SELECT ON public.modifier_scores TO anon, authenticated;
GRANT INSERT, UPDATE ON public.modifier_scores TO authenticated;
GRANT ALL ON public.modifier_scores TO service_role;
ALTER TABLE public.modifier_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mods_read" ON public.modifier_scores FOR SELECT USING (true);
CREATE POLICY "mods_own_write" ON public.modifier_scores FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 14. Anti-cheat submission log
CREATE TABLE public.score_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  score integer NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  accepted boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.score_submissions TO authenticated;
GRANT ALL ON public.score_submissions TO service_role;
ALTER TABLE public.score_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ss_own_read" ON public.score_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX score_submissions_user_time ON public.score_submissions (user_id, created_at DESC);

-- Seed XP milestones
INSERT INTO public.xp_milestones (level, title, reward_coins, reward_gems, reward_border, reward_title) VALUES
  (10, 'Rookie Rising', 500, 10, 'border_bronze', 'Rookie'),
  (25, 'Arcade Regular', 1500, 25, 'border_silver', 'Regular'),
  (50, 'Glitch Veteran', 4000, 75, 'border_gold', 'Veteran'),
  (100, 'Legend of Glitch', 10000, 200, 'border_legend', 'Legend')
ON CONFLICT (level) DO NOTHING;

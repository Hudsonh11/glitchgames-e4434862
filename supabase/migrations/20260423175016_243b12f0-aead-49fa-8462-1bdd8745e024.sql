-- Prestige system: track resets and permanent multipliers per user
CREATE TABLE public.user_prestige (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  prestige_level integer NOT NULL DEFAULT 0,
  xp_multiplier numeric NOT NULL DEFAULT 1.0,
  coin_multiplier numeric NOT NULL DEFAULT 1.0,
  total_resets integer NOT NULL DEFAULT 0,
  last_prestige_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_prestige ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prestige" ON public.user_prestige
  FOR SELECT USING (true);
CREATE POLICY "Users can manage own prestige" ON public.user_prestige
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_prestige_updated_at
  BEFORE UPDATE ON public.user_prestige
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quests: definitions + per-user progress
CREATE TABLE public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  quest_type text NOT NULL DEFAULT 'daily', -- daily | weekly | seasonal
  goal_type text NOT NULL, -- games_played | score_total | wins | streak | category_played
  goal_target integer NOT NULL DEFAULT 1,
  reward_coins integer NOT NULL DEFAULT 0,
  reward_gems integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quests" ON public.quests
  FOR SELECT USING (active = true);
CREATE POLICY "Admins manage quests" ON public.quests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.user_quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_key text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  claimed boolean NOT NULL DEFAULT false,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_key, period_start)
);

ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quest progress" ON public.user_quest_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quest progress" ON public.user_quest_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_quest_progress_updated_at
  BEFORE UPDATE ON public.user_quest_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a starter set of quests
INSERT INTO public.quests (quest_key, title, description, quest_type, goal_type, goal_target, reward_coins, reward_gems, reward_xp) VALUES
  ('daily_play_3', 'Warm Up', 'Play 3 games today', 'daily', 'games_played', 3, 100, 1, 50),
  ('daily_score_5000', 'High Scorer', 'Score 5,000 points across all games today', 'daily', 'score_total', 5000, 200, 2, 100),
  ('daily_play_5_diff', 'Variety Pack', 'Play 5 different games today', 'daily', 'games_played', 5, 250, 3, 150),
  ('weekly_play_25', 'Marathon', 'Play 25 games this week', 'weekly', 'games_played', 25, 1000, 10, 500),
  ('weekly_score_50000', 'Score Hunter', 'Accumulate 50,000 points this week', 'weekly', 'score_total', 50000, 1500, 15, 750),
  ('seasonal_play_100', 'Centurion', 'Play 100 games this season', 'seasonal', 'games_played', 100, 5000, 50, 2500);
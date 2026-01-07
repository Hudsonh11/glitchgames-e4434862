-- Create friendships table for friend requests
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create messages table (only between friends)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_titles table for customization
CREATE TABLE public.player_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title_id TEXT NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, title_id)
);

-- Create player_borders table for customization
CREATE TABLE public.player_borders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  border_id TEXT NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, border_id)
);

-- Create player_themes table for customization
CREATE TABLE public.player_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  theme_id TEXT NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, theme_id)
);

-- Create challenges table for competitive features
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  game_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  challenger_score INTEGER,
  challenged_score INTEGER,
  winner_id UUID,
  wager_coins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create ranked_stats table for competitive ranking
CREATE TABLE public.ranked_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id TEXT NOT NULL,
  rank_tier TEXT NOT NULL DEFAULT 'Bronze' CHECK (rank_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster')),
  rank_points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Create player_badges table
CREATE TABLE public.player_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create activity_feed table for social features
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_user_id UUID,
  game_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_status table for online status
CREATE TABLE public.player_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'in_game', 'away')),
  current_game TEXT,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_borders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_status ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests" ON public.friendships
  FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Messages policies (only between friends)
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Player customization policies
CREATE POLICY "Users can view their titles" ON public.player_titles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their titles" ON public.player_titles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their titles" ON public.player_titles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their borders" ON public.player_borders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their borders" ON public.player_borders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their borders" ON public.player_borders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their themes" ON public.player_themes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their themes" ON public.player_themes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their themes" ON public.player_themes
  FOR UPDATE USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Users can view their challenges" ON public.challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Ranked stats policies
CREATE POLICY "Anyone can view ranked stats" ON public.ranked_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their ranked stats" ON public.ranked_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their ranked stats" ON public.ranked_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Anyone can view badges" ON public.player_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their badges" ON public.player_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Anyone can view activity feed" ON public.activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their activities" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Player status policies
CREATE POLICY "Anyone can view player status" ON public.player_status
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their status" ON public.player_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their status" ON public.player_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_status;
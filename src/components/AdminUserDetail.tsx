import React, { useState, useEffect } from 'react';
import {
  User, Coins, Gem, Gamepad2, Trophy, Clock, Calendar,
  Shield, Ban, Activity, X, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface UserDetail {
  username: string;
  coins: number;
  gems: number;
  level: number;
  xp: number;
  avatar: string | null;
  created_at: string;
}

interface GameStat {
  game_id: string;
  games_played: number;
  high_score: number;
  total_time_played: number;
}

interface AdminUserDetailProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  isBanned: boolean;
}

const AdminUserDetail: React.FC<AdminUserDetailProps> = ({ userId, open, onClose, isBanned }) => {
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) fetchDetails();
  }, [open, userId]);

  const fetchDetails = async () => {
    setLoading(true);
    const [profileRes, statsRes, achieveRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('game_stats').select('*').eq('user_id', userId).order('games_played', { ascending: false }),
      supabase.from('achievements').select('achievement_id').eq('user_id', userId),
    ]);
    if (profileRes.data) setProfile(profileRes.data as UserDetail);
    setGameStats((statsRes.data as GameStat[]) || []);
    setAchievements((achieveRes.data || []).map(a => a.achievement_id));
    setLoading(false);
  };

  const totalGamesPlayed = gameStats.reduce((s, g) => s + g.games_played, 0);
  const totalTimePlayed = gameStats.reduce((s, g) => s + g.total_time_played, 0);
  const bestScore = gameStats.reduce((s, g) => Math.max(s, g.high_score), 0);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> User Details
          </DialogTitle>
          <DialogDescription>Full profile and activity history</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                alt=""
                className="w-16 h-16 rounded-full border-2 border-primary/30"
              />
              <div>
                <h3 className="font-display text-lg font-bold">{profile.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Lv.{profile.level}</span>
                  {isBanned && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Banned</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Coins</span>
                </div>
                <p className="text-xl font-bold text-warning">{profile.coins.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Gem className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Gems</span>
                </div>
                <p className="text-xl font-bold text-secondary">{profile.gems.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">XP</span>
                </div>
                <p className="text-xl font-bold text-primary">{profile.xp.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">Best Score</span>
                </div>
                <p className="text-xl font-bold text-success">{bestScore.toLocaleString()}</p>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Activity Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Games Played</span>
                  <span className="font-medium">{totalGamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Played</span>
                  <span className="font-medium">{Math.round(totalTimePlayed / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unique Games</span>
                  <span className="font-medium">{gameStats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Achievements</span>
                  <span className="font-medium">{achievements.length}</span>
                </div>
              </div>
            </div>

            {/* Top Games */}
            {gameStats.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h4 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" /> Top Games
                </h4>
                <div className="space-y-2">
                  {gameStats.slice(0, 5).map(g => (
                    <div key={g.game_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-sm capitalize">{g.game_id.replace(/-/g, ' ')}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{g.games_played} plays</span>
                        <span className="text-primary font-medium">{g.high_score.toLocaleString()} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">User not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserDetail;

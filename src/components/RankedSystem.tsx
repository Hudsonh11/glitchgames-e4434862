import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, Medal, Crown, Star, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';

interface RankedStats {
  gameId: string;
  rankTier: string;
  rankPoints: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  rankTier: string;
  rankPoints: number;
  wins: number;
}

const RANK_TIERS = [
  { name: 'Bronze', minPoints: 0, color: 'hsl(30, 60%, 50%)', icon: Medal },
  { name: 'Silver', minPoints: 500, color: 'hsl(0, 0%, 70%)', icon: Medal },
  { name: 'Gold', minPoints: 1000, color: 'hsl(45, 100%, 50%)', icon: Trophy },
  { name: 'Platinum', minPoints: 1500, color: 'hsl(185, 80%, 60%)', icon: Trophy },
  { name: 'Diamond', minPoints: 2000, color: 'hsl(200, 100%, 60%)', icon: Crown },
  { name: 'Master', minPoints: 2500, color: 'hsl(280, 80%, 60%)', icon: Crown },
  { name: 'Grandmaster', minPoints: 3000, color: 'hsl(0, 100%, 50%)', icon: Star }
];

const RANKED_GAMES = [
  { id: 'tetris', name: 'Tetris', icon: '🧱' },
  { id: 'snake', name: 'Snake', icon: '🐍' },
  { id: 'geometry-dash', name: 'Geometry Dash', icon: '🔷' },
  { id: '2048', name: '2048', icon: '🔢' },
  { id: 'space-invaders', name: 'Space Invaders', icon: '👾' },
  { id: 'pac-man', name: 'Pac-Man', icon: '👻' },
  { id: 'block-blast', name: 'Block Blast', icon: '🟦' },
  { id: 'flappy', name: 'Flappy Bird', icon: '🐦' },
  { id: 'racing', name: 'Neon Racer', icon: '🏎️' },
  { id: 'brick-breaker', name: 'Brick Breaker', icon: '🧱' },
  { id: 'maze', name: 'Maze Runner', icon: '🔲' },
  { id: 'memory', name: 'Memory Match', icon: '🃏' },
  { id: 'wordle', name: 'Wordle', icon: '📝' },
  { id: 'sudoku', name: 'Sudoku', icon: '🔢' },
  { id: 'minesweeper', name: 'Minesweeper', icon: '💣' },
];

const RankedSystem: React.FC = () => {
  const { user, isLoggedIn } = useGame();
  const [myStats, setMyStats] = useState<Record<string, RankedStats>>({});
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [selectedGame, setSelectedGame] = useState(RANKED_GAMES[0].id);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchMyStats();
      fetchLeaderboard(selectedGame);
    }
  }, [isLoggedIn, user, selectedGame]);

  const fetchMyStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('ranked_stats')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const stats: Record<string, RankedStats> = {};
      data.forEach(s => {
        stats[s.game_id] = {
          gameId: s.game_id,
          rankTier: s.rank_tier,
          rankPoints: s.rank_points,
          wins: s.wins,
          losses: s.losses,
          winStreak: s.win_streak,
          bestWinStreak: s.best_win_streak
        };
      });
      setMyStats(stats);
    }
  };

  const fetchLeaderboard = async (gameId: string) => {
    const { data } = await supabase
      .from('ranked_stats')
      .select(`
        rank_points,
        rank_tier,
        wins,
        user_id,
        profiles!inner (username)
      `)
      .eq('game_id', gameId)
      .order('rank_points', { ascending: false })
      .limit(50);

    if (data) {
      const entries: LeaderboardEntry[] = data.map((item: any, index) => ({
        rank: index + 1,
        username: item.profiles.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.profiles.username}`,
        rankTier: item.rank_tier,
        rankPoints: item.rank_points,
        wins: item.wins
      }));
      setLeaderboards(prev => ({ ...prev, [gameId]: entries }));
    }
  };

  const getRankInfo = (tier: string) => {
    return RANK_TIERS.find(r => r.name === tier) || RANK_TIERS[0];
  };

  const getNextRank = (currentPoints: number) => {
    const nextRank = RANK_TIERS.find(r => r.minPoints > currentPoints);
    return nextRank || RANK_TIERS[RANK_TIERS.length - 1];
  };

  const getProgressToNextRank = (points: number) => {
    const currentRank = RANK_TIERS.filter(r => r.minPoints <= points).pop() || RANK_TIERS[0];
    const nextRank = getNextRank(points);
    if (currentRank.name === nextRank.name) return 100;
    
    const pointsInCurrentRank = points - currentRank.minPoints;
    const pointsNeededForNext = nextRank.minPoints - currentRank.minPoints;
    return Math.min(100, (pointsInCurrentRank / pointsNeededForNext) * 100);
  };

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Log in to view ranked stats</p>
      </div>
    );
  }

  const currentStats = myStats[selectedGame];
  const currentRankInfo = currentStats ? getRankInfo(currentStats.rankTier) : RANK_TIERS[0];
  const RankIcon = currentRankInfo.icon;

  return (
    <div className="space-y-8">
      {/* Game Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {RANKED_GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              selectedGame === game.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:border-primary/50'
            }`}
          >
            <span>{game.icon}</span>
            <span className="font-medium">{game.name}</span>
          </button>
        ))}
      </div>

      <Tabs defaultValue="mystats">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mystats">My Stats</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="mystats" className="mt-6">
          {currentStats ? (
            <div className="space-y-6">
              {/* Rank Display */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted border border-border">
                <div className="flex items-center gap-6">
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentRankInfo.color}20`, border: `2px solid ${currentRankInfo.color}` }}
                  >
                    <RankIcon className="w-12 h-12" style={{ color: currentRankInfo.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-bold" style={{ color: currentRankInfo.color }}>
                      {currentStats.rankTier}
                    </h3>
                    <p className="text-muted-foreground">{currentStats.rankPoints} RP</p>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress to {getNextRank(currentStats.rankPoints).name}</span>
                        <span className="text-primary">{Math.floor(getProgressToNextRank(currentStats.rankPoints))}%</span>
                      </div>
                      <Progress value={getProgressToNextRank(currentStats.rankPoints)} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <Trophy className="w-8 h-8 mx-auto text-success mb-2" />
                  <p className="text-2xl font-display font-bold text-success">{currentStats.wins}</p>
                  <p className="text-sm text-muted-foreground">Wins</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-destructive mb-2" />
                  <p className="text-2xl font-display font-bold text-destructive">{currentStats.losses}</p>
                  <p className="text-sm text-muted-foreground">Losses</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <Flame className="w-8 h-8 mx-auto text-warning mb-2" />
                  <p className="text-2xl font-display font-bold text-warning">{currentStats.winStreak}</p>
                  <p className="text-sm text-muted-foreground">Win Streak</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <Zap className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-display font-bold text-primary">{currentStats.bestWinStreak}</p>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
              </div>

              {/* Win Rate */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-bold text-primary">
                    {currentStats.wins + currentStats.losses > 0
                      ? Math.round((currentStats.wins / (currentStats.wins + currentStats.losses)) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={currentStats.wins + currentStats.losses > 0
                    ? (currentStats.wins / (currentStats.wins + currentStats.losses)) * 100
                    : 0} 
                  className="h-3" 
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Play ranked matches to see your stats!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <div className="space-y-3">
            {(leaderboards[selectedGame] || []).map(entry => {
              const rankInfo = getRankInfo(entry.rankTier);
              return (
                <div 
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    entry.rank <= 3 
                      ? 'bg-gradient-to-r from-card to-warning/10 border-warning/30'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold ${
                    entry.rank === 1 ? 'bg-warning text-warning-foreground' :
                    entry.rank === 2 ? 'bg-muted-foreground text-white' :
                    entry.rank === 3 ? 'bg-orange-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {entry.rank}
                  </div>
                  <img src={entry.avatar} alt={entry.username} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-display font-bold">{entry.username}</p>
                    <p className="text-sm" style={{ color: rankInfo.color }}>{entry.rankTier}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-primary">{entry.rankPoints} RP</p>
                    <p className="text-sm text-muted-foreground">{entry.wins} wins</p>
                  </div>
                </div>
              );
            })}
            
            {(!leaderboards[selectedGame] || leaderboards[selectedGame].length === 0) && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No ranked players yet. Be the first!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankedSystem;

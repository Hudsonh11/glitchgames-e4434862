import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Gamepad2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import UltraParticles from '@/components/UltraParticles';
import UltraCard from '@/components/UltraCard';
import UltraRankDisplay from '@/components/UltraRankDisplay';
import UltraBadge from '@/components/UltraBadge';
import UltraAvatar from '@/components/UltraAvatar';
import UltraLoadingSpinner from '@/components/UltraLoadingSpinner';

const games = [
  { id: 'block-blast', name: 'Block Blast' },
  { id: 'clicker', name: 'Click Frenzy' },
  { id: 'geometry-dash', name: 'Geometry Dash' },
  { id: 'tetris', name: 'Tetris' },
  { id: 'pac-man', name: 'Pac-Man' },
  { id: 'snake', name: 'Snake' },
];

const Leaderboard: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('block-blast');
  const [isLoading, setIsLoading] = useState(false);
  const { leaderboard, user, fetchLeaderboard } = useGame();

  useEffect(() => {
    setIsLoading(true);
    fetchLeaderboard(selectedGame).finally(() => setIsLoading(false));
  }, [selectedGame]);

  const filteredLeaderboard = leaderboard
    .filter(entry => entry.gameId === selectedGame)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <UltraParticles count={25} />
      
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-warning/30 to-amber-500/30 mb-4 animate-float relative">
              <Trophy className="w-10 h-10 text-warning" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning animate-pulse" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-gradient">Leaderboard</h1>
            <p className="text-muted-foreground">Compete with players worldwide!</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {games.map((game) => (
              <Button
                key={game.id}
                variant={selectedGame === game.id ? 'gaming' : 'outline'}
                onClick={() => setSelectedGame(game.id)}
                size="sm"
              >
                {game.name}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <UltraLoadingSpinner size="lg" text="Loading rankings..." />
            </div>
          ) : (
            <>
              {filteredLeaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-8">
                  <div className="flex flex-col items-center">
                    <UltraAvatar src={filteredLeaderboard[1]?.avatar} size="lg" level={15} />
                    <p className="font-display font-bold text-sm mt-2">{filteredLeaderboard[1]?.username}</p>
                    <UltraBadge variant="common" size="sm">{filteredLeaderboard[1]?.score.toLocaleString()}</UltraBadge>
                    <div className="w-20 h-24 rounded-t-lg bg-slate-600/30 flex items-center justify-center mt-3">
                      <span className="font-display text-3xl font-bold text-slate-300">2</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Crown className="w-10 h-10 text-warning mb-2 animate-float" />
                    <UltraAvatar src={filteredLeaderboard[0]?.avatar} size="xl" level={25} border="rainbow" />
                    <p className="font-display font-bold mt-2">{filteredLeaderboard[0]?.username}</p>
                    <UltraBadge variant="legendary" icon="trophy" size="md" animated>{filteredLeaderboard[0]?.score.toLocaleString()}</UltraBadge>
                    <div className="w-24 h-32 rounded-t-lg bg-warning/20 flex items-center justify-center mt-3 border border-warning/50 shadow-neon-gold">
                      <span className="font-display text-4xl font-bold text-warning">1</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <UltraAvatar src={filteredLeaderboard[2]?.avatar} size="lg" level={12} />
                    <p className="font-display font-bold text-sm mt-2">{filteredLeaderboard[2]?.username}</p>
                    <UltraBadge variant="common" size="sm">{filteredLeaderboard[2]?.score.toLocaleString()}</UltraBadge>
                    <div className="w-20 h-20 rounded-t-lg bg-amber-800/30 flex items-center justify-center mt-3">
                      <span className="font-display text-3xl font-bold text-amber-600">3</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {filteredLeaderboard.length === 0 ? (
                  <UltraCard variant="glass" className="text-center py-12">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No scores yet. Be the first!</p>
                  </UltraCard>
                ) : (
                  filteredLeaderboard.map((entry, index) => (
                    <UltraRankDisplay
                      key={`${entry.username}-${index}`}
                      data={{
                        rank: index + 1,
                        username: entry.username,
                        avatar: entry.avatar,
                        score: entry.score,
                        isCurrentUser: entry.username === user?.username,
                      }}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

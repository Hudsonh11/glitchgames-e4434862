import React, { useState } from 'react';
import { Trophy, Medal, Crown, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';

const games = [
  { id: 'block-blast', name: 'Block Blast' },
  { id: 'clicker', name: 'Click Frenzy' },
  { id: 'geometry-dash', name: 'Geometry Dash' },
  { id: 'racing', name: 'Neon Racer' },
];

const Leaderboard: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('block-blast');
  const { leaderboard, user } = useGame();

  const filteredLeaderboard = leaderboard
    .filter(entry => entry.gameId === selectedGame)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-warning" />;
      case 2:
        return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="w-6 text-center font-display font-bold">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-warning/10 border-warning/50 shadow-neon-gold';
      case 2:
        return 'bg-muted/50 border-muted-foreground/30';
      case 3:
        return 'bg-amber-900/20 border-amber-700/30';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/20 mb-4">
              <Trophy className="w-8 h-8 text-warning" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">
              Compete with players worldwide and climb to the top!
            </p>
          </div>

          {/* Game Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {games.map((game) => (
              <Button
                key={game.id}
                variant={selectedGame === game.id ? 'gaming' : 'outline'}
                onClick={() => setSelectedGame(game.id)}
                className="gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                {game.name}
              </Button>
            ))}
          </div>

          {/* Top 3 Podium */}
          {filteredLeaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <img
                  src={filteredLeaderboard[1]?.avatar}
                  alt=""
                  className="w-16 h-16 rounded-full border-4 border-muted-foreground mb-2"
                />
                <p className="font-display font-bold text-sm">{filteredLeaderboard[1]?.username}</p>
                <p className="text-xs text-muted-foreground">{filteredLeaderboard[1]?.score}</p>
                <div className="w-20 h-24 rounded-t-lg bg-muted flex items-center justify-center mt-2">
                  <span className="font-display text-3xl font-bold text-muted-foreground">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <Crown className="w-8 h-8 text-warning mb-1 animate-float" />
                <img
                  src={filteredLeaderboard[0]?.avatar}
                  alt=""
                  className="w-20 h-20 rounded-full border-4 border-warning mb-2 shadow-neon-gold"
                />
                <p className="font-display font-bold">{filteredLeaderboard[0]?.username}</p>
                <p className="text-sm text-warning font-bold">{filteredLeaderboard[0]?.score}</p>
                <div className="w-24 h-32 rounded-t-lg bg-warning/20 flex items-center justify-center mt-2 border border-warning/50">
                  <span className="font-display text-4xl font-bold text-warning">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <img
                  src={filteredLeaderboard[2]?.avatar}
                  alt=""
                  className="w-16 h-16 rounded-full border-4 border-amber-700 mb-2"
                />
                <p className="font-display font-bold text-sm">{filteredLeaderboard[2]?.username}</p>
                <p className="text-xs text-muted-foreground">{filteredLeaderboard[2]?.score}</p>
                <div className="w-20 h-20 rounded-t-lg bg-amber-900/20 flex items-center justify-center mt-2">
                  <span className="font-display text-3xl font-bold text-amber-700">3</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="space-y-2">
            {filteredLeaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No scores yet for this game.</p>
                <p className="text-sm text-muted-foreground">Be the first to play and set a high score!</p>
              </div>
            ) : (
              filteredLeaderboard.map((entry, index) => (
                <div
                  key={`${entry.username}-${index}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankStyle(index + 1)} ${
                    entry.username === user?.username ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <img
                    src={entry.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-display font-bold">
                      {entry.username}
                      {entry.username === user?.username && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-primary">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

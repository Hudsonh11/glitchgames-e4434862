import React, { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import UltraCard from './UltraCard';
import UltraAvatar from './UltraAvatar';

interface Winner {
  id: string;
  username: string;
  avatar: string;
  game: string;
  score: number;
  timeAgo: string;
}

const mockWinners: Winner[] = [
  { id: '1', username: 'ProGamer99', avatar: 'ProGamer99', game: 'Tetris', score: 45230, timeAgo: '2m ago' },
  { id: '2', username: 'SpeedRunner', avatar: 'SpeedRunner', game: 'Pac-Man', score: 38400, timeAgo: '5m ago' },
  { id: '3', username: 'PuzzleMaster', avatar: 'PuzzleMaster', game: '2048', score: 52100, timeAgo: '8m ago' },
  { id: '4', username: 'ArcadeKing', avatar: 'ArcadeKing', game: 'Snake', score: 12890, timeAgo: '12m ago' },
  { id: '5', username: 'ChampionX', avatar: 'ChampionX', game: 'Wordle', score: 6, timeAgo: '15m ago' },
];

const RecentWinners: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>(mockWinners);
  const [newWinner, setNewWinner] = useState<string | null>(null);

  useEffect(() => {
    // Simulate new winners appearing
    const interval = setInterval(() => {
      const randomWinner = mockWinners[Math.floor(Math.random() * mockWinners.length)];
      const updatedWinner = {
        ...randomWinner,
        id: Date.now().toString(),
        score: randomWinner.score + Math.floor(Math.random() * 1000),
        timeAgo: 'Just now',
      };
      
      setNewWinner(updatedWinner.id);
      setWinners(prev => [updatedWinner, ...prev.slice(0, 4)]);
      
      setTimeout(() => setNewWinner(null), 2000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <UltraCard variant="glass" className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-warning" />
        <h3 className="font-bold text-foreground">Recent High Scores</h3>
        <div className="ml-auto flex items-center gap-1 text-success text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {winners.map((winner, index) => (
          <div
            key={winner.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
              winner.id === newWinner 
                ? 'bg-primary/20 animate-pulse scale-[1.02]' 
                : 'hover:bg-muted/50'
            }`}
          >
            <UltraAvatar 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.avatar}`}
              size="sm"
              border={index === 0 ? 'warning' : 'default'}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm truncate">
                  {winner.username}
                </span>
                {winner.id === newWinner && (
                  <Sparkles className="w-3 h-3 text-warning animate-spin" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{winner.game}</p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 text-warning">
                <Star className="w-3 h-3 fill-warning" />
                <span className="font-bold text-sm">{winner.score.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{winner.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
    </UltraCard>
  );
};

export default RecentWinners;

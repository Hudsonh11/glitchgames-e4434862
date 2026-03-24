import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Users, Play, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PopularGame {
  id: string;
  title: string;
  players: string;
  trend: 'up' | 'stable';
  image: string;
  color: string;
}

const PopularNow: React.FC<{ games: PopularGame[] }> = ({ games }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % Math.min(games.length, 5));
    }, 3000);
    return () => clearInterval(interval);
  }, [games.length]);

  const topGames = games.slice(0, 5);

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive via-warning to-destructive animate-gradient-x" />
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-destructive fill-destructive animate-pulse" />
        <h3 className="font-display text-lg font-bold">Popular Right Now</h3>
        <span className="ml-auto text-xs text-muted-foreground">Live</span>
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>
      <div className="space-y-2">
        {topGames.map((game, i) => (
          <Link key={game.id} to={`/game/${game.id}`}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group cursor-pointer ${
              i === activeIndex ? 'bg-primary/10 border border-primary/20 shadow-glow' : 'hover:bg-muted/50'
            }`}>
            <span className="font-display text-lg font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{game.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> {game.players} playing
                {game.trend === 'up' && <TrendingUp className="w-3 h-3 text-success ml-1" />}
              </p>
            </div>
            <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularNow;

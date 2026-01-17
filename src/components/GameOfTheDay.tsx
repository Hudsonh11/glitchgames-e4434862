import React, { useMemo } from 'react';
import { Crown, Sparkles, Trophy, Users, ArrowRight, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';

interface Game {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  players: string;
  color: string;
}

interface GameOfTheDayProps {
  games: Game[];
}

const GameOfTheDay: React.FC<GameOfTheDayProps> = ({ games }) => {
  const gameOfTheDay = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return games[dayOfYear % games.length];
  }, [games]);

  if (!gameOfTheDay) return null;

  return (
    <UltraCard variant="premium" glow className="relative overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30"
        style={{
          backgroundImage: `url(${gameOfTheDay.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r opacity-30"
        style={{ background: `linear-gradient(135deg, ${gameOfTheDay.color}, transparent)` }}
      />
      
      {/* Animated Sparkles */}
      <div className="absolute top-4 right-4">
        <Sparkles className="w-6 h-6 text-warning animate-pulse" />
      </div>
      
      {/* Content */}
      <div className="relative p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-warning fill-warning" />
          <UltraBadge variant="legendary" size="sm" icon="sparkles">
            Game of the Day
          </UltraBadge>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-3xl md:text-4xl font-black mb-2">
              {gameOfTheDay.title}
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              {gameOfTheDay.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-bold">{gameOfTheDay.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                <span>{gameOfTheDay.players} playing</span>
              </div>
              <UltraBadge variant="rare" size="sm">{gameOfTheDay.category}</UltraBadge>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="group/btn">
              <Trophy className="w-4 h-4 mr-2 text-warning" />
              2x XP Today
            </Button>
            <Button variant="gaming" size="lg" asChild className="group/btn">
              <Link to={`/game/${gameOfTheDay.id}`}>
                <Zap className="w-4 h-4 mr-2 transition-transform group-hover/btn:rotate-12" />
                Play Now
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </UltraCard>
  );
};

export default GameOfTheDay;

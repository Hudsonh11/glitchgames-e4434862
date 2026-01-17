import React from 'react';
import { TrendingUp, Flame, Users, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { cn } from '@/lib/utils';

interface Game {
  id: string;
  title: string;
  category: string;
  rating: number;
  players: string;
  color: string;
  image: string;
}

interface TrendingGamesProps {
  games: Game[];
  limit?: number;
}

const TrendingGames: React.FC<TrendingGamesProps> = ({ games, limit = 5 }) => {
  // Simulate trending based on players and rating
  const trendingGames = [...games]
    .sort((a, b) => {
      const aScore = parseFloat(a.players.replace('K', '')) * a.rating;
      const bScore = parseFloat(b.players.replace('K', '')) * b.rating;
      return bScore - aScore;
    })
    .slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Trending Now
          <Flame className="w-4 h-4 text-error animate-pulse" />
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/#games">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {trendingGames.map((game, index) => (
          <Link 
            key={game.id} 
            to={`/game/${game.id}`}
            className="block"
          >
            <UltraCard
              variant="glass"
              className={cn(
                "p-4 flex items-center gap-4 hover:border-primary/30 transition-all group animate-fade-in-up",
                index === 0 && "bg-gradient-to-r from-warning/10 to-transparent"
              )}
            >
              {/* Rank */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0",
                index === 0 ? "bg-warning/20 text-warning" :
                index === 1 ? "bg-muted text-muted-foreground" :
                index === 2 ? "bg-amber-700/20 text-amber-700" :
                "bg-muted text-muted-foreground"
              )}>
                #{index + 1}
              </div>

              {/* Game Image */}
              <div 
                className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0"
                style={{ 
                  backgroundImage: `url(${game.image})`,
                  backgroundColor: `${game.color}30`
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold truncate">{game.title}</h4>
                  {index === 0 && (
                    <UltraBadge variant="legendary" size="sm" icon="flame">
                      Hot
                    </UltraBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                    {game.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {game.players}
                  </span>
                  <span className="hidden sm:inline">{game.category}</span>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-success text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">+{Math.floor(Math.random() * 50 + 10)}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </UltraCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingGames;

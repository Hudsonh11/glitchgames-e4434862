import React from 'react';
import { Heart, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import UltraCard from '@/components/UltraCard';
import { cn } from '@/lib/utils';

interface FavoriteGamesProps {
  favorites: string[];
  onRemove: (gameId: string) => void;
  games: { id: string; title: string; category: string; color: string }[];
}

const FavoriteGames: React.FC<FavoriteGamesProps> = ({ favorites, onRemove, games }) => {
  const favoriteGames = games.filter(g => favorites.includes(g.id));

  if (favoriteGames.length === 0) {
    return (
      <UltraCard variant="glass" className="p-8 text-center">
        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-lg font-bold mb-2">No Favorites Yet</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Click the heart icon on any game to add it to your favorites!
        </p>
        <Button variant="outline" asChild>
          <Link to="/">Browse Games</Link>
        </Button>
      </UltraCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Heart className="w-5 h-5 text-error fill-error" />
          Your Favorites ({favoriteGames.length})
        </h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {favoriteGames.map((game, index) => (
          <UltraCard 
            key={game.id} 
            variant="glass" 
            className={`p-4 group relative overflow-hidden animate-fade-in-up`}
          >
            <div 
              className="absolute inset-0 opacity-10"
              style={{ background: `linear-gradient(135deg, ${game.color}, transparent)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/80">{game.category}</span>
                <button
                  onClick={() => onRemove(game.id)}
                  className="p-1 rounded-full hover:bg-error/20 transition-colors"
                >
                  <Heart className="w-4 h-4 text-error fill-error" />
                </button>
              </div>
              <h4 className="font-display font-bold text-sm mb-3 line-clamp-1">{game.title}</h4>
              <Button variant="gaming" size="sm" className="w-full" asChild>
                <Link to={`/game/${game.id}`}>Play</Link>
              </Button>
            </div>
          </UltraCard>
        ))}
      </div>
    </div>
  );
};

export default FavoriteGames;

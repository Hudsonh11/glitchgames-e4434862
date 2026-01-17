import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Gamepad2, Star, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Game {
  id: string;
  title: string;
  category: string;
  rating: number;
  color: string;
}

interface SearchGamesProps {
  games: Game[];
  recentSearches?: string[];
  onSearch?: (query: string) => void;
}

const SearchGames: React.FC<SearchGamesProps> = ({ games, recentSearches = [], onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(query.toLowerCase()) ||
    game.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  const popularSearches = ['Tetris', 'Snake', 'Puzzle', 'Action', 'Arcade'];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (gameId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/game/${gameId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredGames.length > 0) {
      handleSelect(filteredGames[0].id);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Search Trigger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Search className="w-5 h-5" />
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className={cn(
            "fixed inset-x-4 top-24 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px]",
            "rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl",
            "animate-in slide-in-from-top-4 fade-in duration-200"
          )}>
            {/* Search Input */}
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search games..."
                  className="pl-10 pr-10 h-12 rounded-xl"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {query ? (
                filteredGames.length > 0 ? (
                  <div className="space-y-1">
                    {filteredGames.map((game, index) => (
                      <button
                        key={game.id}
                        onClick={() => handleSelect(game.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left",
                          "animate-fade-in-up"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${game.color}20` }}
                        >
                          <Gamepad2 className="w-5 h-5" style={{ color: game.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{game.title}</p>
                          <p className="text-xs text-muted-foreground">{game.category}</p>
                        </div>
                        <div className="flex items-center gap-1 text-warning">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-sm font-medium">{game.rating}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No games found for "{query}"</p>
                  </div>
                )
              ) : (
                <div className="space-y-4 p-2">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground px-2 mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Recent
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => setQuery(search)}
                            className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Popular */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Popular
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => setQuery(search)}
                          className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchGames;

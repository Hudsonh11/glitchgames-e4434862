import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Game {
  id: string;
  title: string;
  image: string;
  category: string;
  rating: number;
  players: string;
  color: string;
}

const GenreSpotlight: React.FC<{ games: Game[] }> = ({ games }) => {
  const genres = ['Puzzle', 'Arcade', 'Strategy', 'Runner', 'Shooter'];
  const [activeGenre, setActiveGenre] = useState(genres[0]);
  const genreGames = games.filter(g => g.category === activeGenre).slice(0, 4);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="font-display text-xl font-bold">Genre Spotlight</h3>
        <span className="ml-auto text-xs text-muted-foreground">Explore by genre</span>
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        {genres.map(genre => (
          <button key={genre} onClick={() => setActiveGenre(genre)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              activeGenre === genre
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}>
            {genre}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {genreGames.map(game => (
          <Link key={game.id} to={`/game/${game.id}`} className="group">
            <div className="relative rounded-xl overflow-hidden aspect-video mb-2 transition-transform duration-300 group-hover:scale-[1.03]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs font-bold truncate">{game.title}</span>
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Star className="w-2.5 h-2.5 text-warning fill-warning" /> {game.rating}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GenreSpotlight;

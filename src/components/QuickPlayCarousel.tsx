import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  image: string;
  category: string;
  rating: number;
  color: string;
}

const QuickPlayCarousel: React.FC<{ games: Game[]; title: string }> = ({ games, title }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x snap-mandatory">
        {games.map((game) => (
          <Link key={game.id} to={`/game/${game.id}`} className="group flex-shrink-0 w-36 snap-start">
            <div className="relative rounded-xl overflow-hidden aspect-square mb-2 transition-transform duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
                  <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] bg-background/80 rounded-full px-1.5 py-0.5">
                <Star className="w-2.5 h-2.5 text-warning fill-warning" /> {game.rating}
              </div>
            </div>
            <p className="font-bold text-xs truncate group-hover:text-primary transition-colors">{game.title}</p>
            <p className="text-[10px] text-muted-foreground">{game.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickPlayCarousel;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShowcaseGame {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  players: string;
  color: string;
}

const GameShowcase: React.FC<{ games: ShowcaseGame[] }> = ({ games }) => {
  const [current, setCurrent] = useState(0);
  const featured = games.slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % featured.length), 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const game = featured[current];

  return (
    <div className="relative rounded-3xl overflow-hidden h-[400px] md:h-[500px] group">
      {/* Background */}
      <div className="absolute inset-0 transition-all duration-700" 
        style={{ backgroundImage: `url(${game.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${game.color}dd`, color: 'hsl(var(--primary-foreground))' }}>
            {game.category}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/50 backdrop-blur-sm text-xs">
            <Star className="w-3 h-3 text-warning fill-warning" /> {game.rating}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/50 backdrop-blur-sm text-xs">
            <Users className="w-3 h-3" /> {game.players}
          </span>
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-black mb-3 text-foreground">{game.title}</h2>
        <p className="text-muted-foreground text-lg mb-6 max-w-lg">{game.description}</p>
        <div className="flex items-center gap-4">
          <Button variant="gaming" size="lg" asChild className="gap-2 group/btn">
            <Link to={`/game/${game.id}`}>
              <Play className="w-5 h-5 group-hover/btn:scale-110 transition-transform" /> Play Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4">
        <button onClick={() => setCurrent(p => (p - 1 + featured.length) % featured.length)}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {featured.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/50 hover:bg-muted-foreground'
              }`} />
          ))}
        </div>
        <button onClick={() => setCurrent(p => (p + 1) % featured.length)}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary/20 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Sparkle badge */}
      <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel">
        <Sparkles className="w-4 h-4 text-warning animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">Featured</span>
      </div>
    </div>
  );
};

export default GameShowcase;

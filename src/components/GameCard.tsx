import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  players: string;
  color: string;
}

// Preview screenshots for games (simulated game previews)
const gamePreviewFrames: Record<string, string[]> = {
  'snake': ['🐍', '🐍🍎', '🐍🐍🍎'],
  'tetris': ['⬜⬜⬜', '🟦🟦⬜', '🟦🟦🟩🟩'],
  'flappy': ['🐦', '🐦 |', '🐦  ||'],
  'pong': ['🏓 ⚪', '🏓  ⚪', '🏓   ⚪'],
  'memory': ['🎴🎴', '🎴⭐', '⭐⭐'],
  '2048': ['2 4', '4 8', '8 16'],
  'breakout': ['🟥🟥🟥', '🟥 🟥', '  🔵'],
};

const GameCard: React.FC<GameCardProps> = ({
  id,
  title,
  description,
  image,
  category,
  rating,
  players,
  color,
}) => {
  const { gamesShutdown, isLoggedIn } = useGame();
  const [isHovered, setIsHovered] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);

  // Cycle through preview frames on hover
  useEffect(() => {
    if (!isHovered) {
      setPreviewFrame(0);
      return;
    }

    const frames = gamePreviewFrames[id] || ['🎮', '🎮✨', '🎮🎯'];
    const interval = setInterval(() => {
      setPreviewFrame((prev) => (prev + 1) % frames.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isHovered, id]);

  const frames = gamePreviewFrames[id] || ['🎮', '🎮✨', '🎮🎯'];

  return (
    <div 
      className="game-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        
        {/* Hover Preview Overlay */}
        {isHovered && !gamesShutdown && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center animate-fade-in">
            <div className="text-4xl mb-2 animate-bounce">{frames[previewFrame]}</div>
            <div className="text-sm font-bold text-primary">Preview</div>
            <div className="flex gap-1 mt-2">
              {frames.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === previewFrame ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <div 
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: color, color: 'hsl(var(--primary-foreground))' }}
        >
          {category}
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
          <Star className="w-3 h-3 text-warning fill-warning" />
          <span className="text-xs font-bold">{rating}</span>
        </div>

        {/* Shutdown Overlay */}
        {gamesShutdown && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Game Unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-bold mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{players} playing</span>
          </div>
        </div>

        {/* Play Button */}
        <Link to={gamesShutdown ? '#' : (isLoggedIn ? `/game/${id}` : '/login')}>
          <Button 
            variant="gaming" 
            className="w-full gap-2"
            disabled={gamesShutdown}
          >
            <Play className="w-4 h-4" />
            {gamesShutdown ? 'Unavailable' : (isLoggedIn ? 'Play Now' : 'Sign In to Play')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default GameCard;

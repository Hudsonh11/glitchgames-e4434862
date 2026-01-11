import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, Lock, Sparkles } from 'lucide-react';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={cardRef}
      className="game-card group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
    >
      {/* Animated Border Glow */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: `linear-gradient(135deg, ${color}, transparent 50%, hsl(var(--primary)))`,
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Image Container */}
      <div className="relative h-48 overflow-hidden z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ 
            backgroundImage: `url(${image})`,
            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        
        {/* Shimmer Effect */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
            transition-transform duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`}
          style={{ transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)' }}
        />
        
        {/* Category Badge */}
        <div 
          className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider 
            backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow-lg
            transition-all duration-300 group-hover:scale-105"
          style={{ 
            backgroundColor: `${color}dd`,
            color: 'hsl(var(--primary-foreground))',
            boxShadow: isHovered ? `0 0 20px ${color}80` : 'none',
          }}
        >
          <Sparkles className="w-3 h-3" />
          {category}
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full 
          bg-background/90 backdrop-blur-md border border-white/10 shadow-lg
          transition-all duration-300 group-hover:scale-105 group-hover:bg-background">
          <Star className="w-3.5 h-3.5 text-warning fill-warning" />
          <span className="text-xs font-bold">{rating}</span>
        </div>

        {/* Shutdown Overlay */}
        {gamesShutdown && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Game Unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 relative z-10">
        <h3 className="font-display text-lg font-bold mb-1 group-hover:text-primary transition-colors duration-300 
          flex items-center gap-2">
          {title}
          {rating >= 4.8 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium">
              HOT
            </span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">{players} playing</span>
          </div>
          
          {/* Live indicator for popular games */}
          {parseInt(players.replace(/[^0-9]/g, '')) > 20 && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs text-success font-medium">LIVE</span>
            </div>
          )}
        </div>

        {/* Play Button */}
        <Link to={gamesShutdown ? '#' : (isLoggedIn ? `/game/${id}` : '/login')}>
          <Button 
            variant="gaming" 
            className="w-full gap-2 group/btn relative overflow-hidden"
            disabled={gamesShutdown}
          >
            <Play className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
            <span className="relative z-10">
              {gamesShutdown ? 'Unavailable' : (isLoggedIn ? 'Play Now' : 'Sign In to Play')}
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default GameCard;

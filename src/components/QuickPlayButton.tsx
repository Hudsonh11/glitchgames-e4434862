import React, { useState, useEffect } from 'react';
import { Shuffle, Gamepad2, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuickPlayButtonProps {
  games: { id: string; title: string; category: string }[];
  isLoggedIn: boolean;
}

const QuickPlayButton: React.FC<QuickPlayButtonProps> = ({ games, isLoggedIn }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedGame, setSelectedGame] = useState<typeof games[0] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleQuickPlay = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setIsSpinning(true);
    
    // Simulate slot machine effect
    let spins = 0;
    const maxSpins = 15;
    const interval = setInterval(() => {
      const randomGame = games[Math.floor(Math.random() * games.length)];
      setSelectedGame(randomGame);
      spins++;
      
      if (spins >= maxSpins) {
        clearInterval(interval);
        setIsSpinning(false);
        // Navigate after a short delay
        setTimeout(() => {
          navigate(`/game/${randomGame.id}`);
        }, 500);
      }
    }, 80);
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <Button
        variant="gaming"
        size="xl"
        className="relative overflow-hidden group px-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleQuickPlay}
        disabled={isSpinning}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer" />
        
        {/* Content */}
        <div className="relative flex items-center gap-3">
          {isSpinning ? (
            <>
              <Shuffle className="w-5 h-5 animate-spin" />
              <span className="font-bold">
                {selectedGame ? selectedGame.title : 'Picking...'}
              </span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              <span className="font-bold">Quick Play</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </div>

        {/* Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              className={`absolute w-3 h-3 text-white/50 transition-all duration-500 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: `${15 + i * 15}%`,
                top: isHovered ? '20%' : '50%',
                transitionDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </Button>

      {/* Tooltip */}
      {isHovered && !isSpinning && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fade-in">
          <div className="px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur border border-border text-xs text-muted-foreground">
            <Gamepad2 className="w-3 h-3 inline mr-1" />
            Jump into a random game instantly!
          </div>
        </div>
      )}

      {/* Selected Game Preview */}
      {isSpinning && selectedGame && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 animate-fade-in">
          <div className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/50 text-center">
            <span className="text-xs text-muted-foreground block">{selectedGame.category}</span>
            <span className="font-bold text-primary">{selectedGame.title}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickPlayButton;

import React, { useState, useRef } from 'react';
import { Shuffle, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { playSfx } from '@/lib/sfx';

interface QuickPlayButtonProps {
  games: { id: string; title: string; category: string }[];
  isLoggedIn: boolean;
}

const QuickPlayButton: React.FC<QuickPlayButtonProps> = ({ games, isLoggedIn }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedGame, setSelectedGame] = useState<typeof games[0] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const tickRef = useRef<number | null>(null);

  const handleQuickPlay = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (isSpinning || games.length === 0) return;

    setIsSpinning(true);
    playSfx('powerup');

    // Slot-machine style roll: fast then slow down (ease-out).
    const totalDuration = 1600;
    const finalGame = games[Math.floor(Math.random() * games.length)];
    let elapsed = 0;
    let step = 55;

    const tick = () => {
      elapsed += step;
      // Ease deceleration
      const progress = Math.min(elapsed / totalDuration, 1);
      step = 55 + progress * 120;
      const idx = Math.floor(Math.random() * games.length);
      setReelIndex(idx);
      setSelectedGame(games[idx]);
      playSfx('tick');

      if (elapsed >= totalDuration) {
        setSelectedGame(finalGame);
        playSfx('win');
        setIsSpinning(false);
        setTimeout(() => navigate(`/game/${finalGame.id}`), 700);
        return;
      }
      tickRef.current = window.setTimeout(tick, step);
    };
    tick();
  };

  return (
    <div className="relative">
      <Button
        variant="gaming"
        size="xl"
        className="relative overflow-hidden group px-8 focus-ring-glow"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleQuickPlay}
        disabled={isSpinning}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-pan" />

        <div className="relative flex items-center gap-3">
          {isSpinning ? (
            <>
              <Shuffle className="w-5 h-5 animate-spin" />
              <div className="relative h-6 min-w-[140px] overflow-hidden rounded-md bg-black/25 px-3">
                <div key={reelIndex} className="animate-count-up font-bold text-white leading-6 truncate">
                  {selectedGame?.title ?? 'Rolling…'}
                </div>
              </div>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 transition-transform group-hover:scale-125 group-hover:rotate-12" />
              <span className="font-bold">Quick Play</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              className={`absolute w-3 h-3 text-white/60 transition-all duration-500 ${
                isHovered || isSpinning ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: `${10 + i * 15}%`,
                top: (isHovered || isSpinning) ? `${20 + (i % 2) * 40}%` : '50%',
                transitionDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      </Button>

      {isSpinning && selectedGame && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 animate-elastic-in">
          <div className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/50 text-center backdrop-blur">
            <span className="text-xs text-muted-foreground block">{selectedGame.category}</span>
            <span className="font-bold text-primary">{selectedGame.title}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickPlayButton;

import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from './UltraCard';

const tips = [
  { game: 'General', tip: 'Play daily to maintain your streak and earn bonus rewards!' },
  { game: 'Tetris', tip: 'Save the I-piece for clearing 4 lines at once for maximum points.' },
  { game: 'Snake', tip: 'Stay close to walls - it gives you more reaction time.' },
  { game: '2048', tip: 'Keep your highest tile in a corner and never move it.' },
  { game: 'Pac-Man', tip: 'Ghosts have patterns - learn them to survive longer.' },
  { game: 'Memory', tip: 'Focus on remembering 2-3 cards at a time, not all of them.' },
  { game: 'Wordle', tip: 'Start with words containing common vowels like ADIEU or AUDIO.' },
  { game: 'Chess', tip: 'Control the center of the board early for better positioning.' },
  { game: 'Minesweeper', tip: 'Start by clicking corners - they reveal the most information.' },
  { game: 'Block Blast', tip: 'Focus on creating chain reactions for combo multipliers.' },
];

interface GameTipsProps {
  dismissible?: boolean;
}

const GameTips: React.FC<GameTipsProps> = ({ dismissible = true }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        nextTip();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentTip, isAnimating]);

  const nextTip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
      setIsAnimating(false);
    }, 300);
  };

  const prevTip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);
      setIsAnimating(false);
    }, 300);
  };

  if (dismissed) return null;

  return (
    <UltraCard variant="glass" className="p-4 relative overflow-hidden">
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 w-6 h-6 p-0 hover:bg-destructive/20"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-warning" />
        </div>
        
        <div className={`flex-1 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <p className="text-xs text-primary font-semibold mb-1">{tips[currentTip].game} Tip</p>
          <p className="text-sm text-foreground">{tips[currentTip].tip}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1">
          {tips.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentTip ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={prevTip}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={nextTip}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </UltraCard>
  );
};

export default GameTips;

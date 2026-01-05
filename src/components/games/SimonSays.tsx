import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SimonSaysProps {
  onScoreUpdate?: (score: number) => void;
}

const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
type Color = typeof COLORS[number];

const SimonSays: React.FC<SimonSaysProps> = ({ onScoreUpdate }) => {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const playSound = (color: Color) => {
    // Visual feedback instead of sound
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 300);
  };

  const showSequence = useCallback(async (seq: Color[]) => {
    setIsShowingSequence(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      playSound(seq[i]);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsShowingSequence(false);
  }, []);

  const addToSequence = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    setPlayerSequence([]);
    showSequence(newSequence);
  }, [sequence, showSequence]);

  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setIsPlaying(true);
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSequence([firstColor]);
    setTimeout(() => showSequence([firstColor]), 500);
  };

  const handleColorClick = (color: Color) => {
    if (!isPlaying || isShowingSequence) return;

    playSound(color);
    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    const currentIndex = newPlayerSequence.length - 1;
    
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong!
      setIsPlaying(false);
      if (score > highScore) {
        setHighScore(score);
      }
      onScoreUpdate?.(score);
      toast.error(`Wrong! Your score: ${score}`);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      // Correct sequence!
      const newScore = score + 1;
      setScore(newScore);
      toast.success(`Correct! Level ${newScore + 1}`);
      
      setTimeout(() => {
        addToSequence();
      }, 1000);
    }
  };

  const getColorClass = (color: Color): string => {
    const base = {
      red: 'bg-red-500 hover:bg-red-400',
      blue: 'bg-blue-500 hover:bg-blue-400',
      green: 'bg-green-500 hover:bg-green-400',
      yellow: 'bg-yellow-400 hover:bg-yellow-300'
    };
    const active = activeColor === color ? 'brightness-150 scale-105' : '';
    return `${base[color]} ${active}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-secondary">{highScore}</div>
          <div className="text-sm text-muted-foreground">High Score</div>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-800 rounded-full">
          {COLORS.map(color => (
            <button
              key={color}
              className={`w-24 h-24 md:w-32 md:h-32 rounded-full transition-all duration-150 shadow-lg
                ${getColorClass(color)}
                ${!isPlaying || isShowingSequence ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                ${color === 'red' ? 'rounded-br-none' : ''}
                ${color === 'blue' ? 'rounded-bl-none' : ''}
                ${color === 'green' ? 'rounded-tr-none' : ''}
                ${color === 'yellow' ? 'rounded-tl-none' : ''}`}
              onClick={() => handleColorClick(color)}
              disabled={!isPlaying || isShowingSequence}
            />
          ))}
          
          {/* Center button */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center">
              {!isPlaying ? (
                <Button onClick={startGame} variant="gaming" size="sm">
                  Start
                </Button>
              ) : (
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{sequence.length}</div>
                  <div className="text-xs text-gray-400">Level</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        {isShowingSequence ? (
          <p className="text-lg text-primary animate-pulse">Watch the sequence...</p>
        ) : isPlaying ? (
          <p className="text-lg text-muted-foreground">Your turn! Repeat the pattern</p>
        ) : (
          <p className="text-lg text-muted-foreground">Press Start to play</p>
        )}
      </div>
    </div>
  );
};

export default SimonSays;

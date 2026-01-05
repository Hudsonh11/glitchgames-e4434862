import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WhackAMoleProps {
  onScoreUpdate?: (score: number) => void;
}

const WhackAMole: React.FC<WhackAMoleProps> = ({ onScoreUpdate }) => {
  const [moles, setMoles] = useState<boolean[]>(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number>();
  const moleTimerRef = useRef<number>();

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setMoles(Array(9).fill(false));
  };

  const whackMole = (index: number) => {
    if (!moles[index] || !isPlaying) return;
    
    setScore(s => {
      const newScore = s + 10;
      return newScore;
    });
    
    setMoles(prev => {
      const newMoles = [...prev];
      newMoles[index] = false;
      return newMoles;
    });
  };

  useEffect(() => {
    if (!isPlaying) return;

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsPlaying(false);
          clearInterval(timer);
          if (score > highScore) {
            setHighScore(score);
          }
          onScoreUpdate?.(score);
          toast.success(`Time's up! Score: ${score}`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Mole popping
    moleTimerRef.current = window.setInterval(() => {
      setMoles(prev => {
        const newMoles = [...prev];
        // Hide all moles
        newMoles.fill(false);
        // Show 1-2 random moles
        const numMoles = Math.random() > 0.7 ? 2 : 1;
        for (let i = 0; i < numMoles; i++) {
          const randomIndex = Math.floor(Math.random() * 9);
          newMoles[randomIndex] = true;
        }
        return newMoles;
      });
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(moleTimerRef.current);
    };
  }, [isPlaying, score, highScore, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
            {timeLeft}s
          </div>
          <div className="text-sm text-muted-foreground">Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-secondary">{highScore}</div>
          <div className="text-sm text-muted-foreground">Best</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-b from-green-800 to-green-900 rounded-xl">
        {moles.map((isUp, index) => (
          <button
            key={index}
            className="relative w-20 h-20 md:w-24 md:h-24 cursor-pointer"
            onClick={() => whackMole(index)}
          >
            {/* Hole */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-amber-900 to-amber-950 rounded-[50%] shadow-inner" />
            
            {/* Mole */}
            <div 
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl transition-all duration-150
                ${isUp ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
              🦫
            </div>
            
            {/* Grass overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-green-700 to-transparent pointer-events-none" />
          </button>
        ))}
      </div>

      {!isPlaying && (
        <Button onClick={startGame} variant="gaming" size="lg">
          {timeLeft === 0 ? 'Play Again' : 'Start Game'}
        </Button>
      )}

      <p className="text-sm text-muted-foreground">
        {isPlaying ? 'Click the moles as fast as you can!' : 'Press Start to begin whacking!'}
      </p>
    </div>
  );
};

export default WhackAMole;

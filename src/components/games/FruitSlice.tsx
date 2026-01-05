import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FruitSliceProps {
  onScoreUpdate?: (score: number) => void;
}

type Fruit = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  sliced: boolean;
};

const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🥝', '🍑'];

const FruitSlice: React.FC<FruitSliceProps> = ({ onScoreUpdate }) => {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [combo, setCombo] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setIsPlaying(true);
    setFruits([]);
    setCombo(0);
  };

  const spawnFruit = useCallback(() => {
    const x = 50 + Math.random() * 300;
    const newFruit: Fruit = {
      id: idRef.current++,
      x,
      y: 400,
      vx: (200 - x) / 30 + (Math.random() - 0.5) * 3,
      vy: -12 - Math.random() * 4,
      type: FRUITS[Math.floor(Math.random() * FRUITS.length)],
      sliced: false
    };
    setFruits(prev => [...prev, newFruit]);
  }, []);

  const sliceFruit = (id: number) => {
    setFruits(prev => prev.map(f => {
      if (f.id === id && !f.sliced) {
        setScore(s => {
          const bonus = combo > 0 ? combo * 5 : 0;
          return s + 10 + bonus;
        });
        setCombo(c => c + 1);
        return { ...f, sliced: true };
      }
      return f;
    }));
  };

  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(spawnFruit, 1000);
    
    const gameLoop = setInterval(() => {
      setFruits(prev => {
        const updated = prev.map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          vy: f.vy + 0.3 // gravity
        }));
        
        // Check for missed fruits
        const missed = updated.filter(f => f.y > 420 && !f.sliced);
        if (missed.length > 0) {
          setLives(l => {
            const newLives = l - missed.length;
            if (newLives <= 0) {
              setIsPlaying(false);
              onScoreUpdate?.(score);
              toast.error(`Game Over! Score: ${score}`);
            }
            return Math.max(0, newLives);
          });
          setCombo(0);
        }
        
        return updated.filter(f => f.y < 450 && f.x > -50 && f.x < 450);
      });
    }, 30);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(gameLoop);
    };
  }, [isPlaying, spawnFruit, score, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-500">{'❤️'.repeat(lives)}</div>
          <div className="text-sm text-muted-foreground">Lives</div>
        </div>
        {combo > 1 && (
          <div>
            <div className="text-2xl font-bold text-yellow-500 animate-pulse">{combo}x</div>
            <div className="text-sm text-muted-foreground">Combo</div>
          </div>
        )}
      </div>

      <div 
        ref={canvasRef}
        className="relative w-[400px] h-[400px] bg-gradient-to-b from-sky-900 to-sky-700 rounded-xl overflow-hidden border-4 border-primary"
      >
        {/* Fruits */}
        {fruits.map(fruit => (
          <button
            key={fruit.id}
            className={`absolute text-4xl cursor-pointer transition-all ${fruit.sliced ? 'opacity-0 scale-150' : 'hover:scale-110'}`}
            style={{ 
              left: fruit.x, 
              top: fruit.y,
              transform: `rotate(${fruit.id * 45}deg)`
            }}
            onClick={() => sliceFruit(fruit.id)}
          >
            {fruit.sliced ? '💥' : fruit.type}
          </button>
        ))}

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              {lives === 0 && <p className="text-white text-xl mb-4">Final Score: {score}</p>}
              <Button onClick={startGame} variant="gaming" size="lg">
                {lives === 0 ? 'Play Again' : 'Start Game'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {isPlaying ? 'Click fruits to slice them! Don\'t let them fall!' : 'Click or tap to slice the fruits'}
      </p>
    </div>
  );
};

export default FruitSlice;

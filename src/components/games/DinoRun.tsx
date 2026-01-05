import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DinoRunProps {
  onScoreUpdate?: (score: number) => void;
}

const DinoRun: React.FC<DinoRunProps> = ({ onScoreUpdate }) => {
  const [dinoY, setDinoY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<{ x: number; type: 'cactus' | 'bird' }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();

  const jump = useCallback(() => {
    if (isJumping || gameOver) return;
    if (!gameStarted) setGameStarted(true);
    setIsJumping(true);
    let jumpHeight = 0;
    const jumpUp = setInterval(() => {
      jumpHeight += 8;
      setDinoY(jumpHeight);
      if (jumpHeight >= 100) {
        clearInterval(jumpUp);
        const fallDown = setInterval(() => {
          jumpHeight -= 8;
          setDinoY(Math.max(0, jumpHeight));
          if (jumpHeight <= 0) {
            clearInterval(fallDown);
            setIsJumping(false);
          }
        }, 20);
      }
    }, 20);
  }, [isJumping, gameOver, gameStarted]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  }, [jump]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    gameLoopRef.current = window.setInterval(() => {
      // Move obstacles
      setObstacles(prev => {
        const newObstacles = prev
          .map(o => ({ ...o, x: o.x - 8 }))
          .filter(o => o.x > -50);
        
        // Add new obstacle
        if (newObstacles.length === 0 || newObstacles[newObstacles.length - 1].x < 300) {
          if (Math.random() < 0.02) {
            newObstacles.push({
              x: 500,
              type: Math.random() > 0.7 ? 'bird' : 'cactus'
            });
          }
        }
        return newObstacles;
      });

      // Update score
      setScore(s => {
        const newScore = s + 1;
        if (newScore % 100 === 0) {
          onScoreUpdate?.(newScore);
        }
        return newScore;
      });

      // Check collision
      setObstacles(prev => {
        const collision = prev.some(o => {
          const dinoLeft = 50;
          const dinoRight = 90;
          const dinoBottom = dinoY;
          const dinoTop = dinoY + 50;
          
          const obstacleLeft = o.x;
          const obstacleRight = o.x + 30;
          const obstacleBottom = o.type === 'bird' ? 60 : 0;
          const obstacleTop = o.type === 'bird' ? 100 : 50;

          return (
            dinoRight > obstacleLeft &&
            dinoLeft < obstacleRight &&
            dinoTop > obstacleBottom &&
            dinoBottom < obstacleTop
          );
        });
        
        if (collision) {
          setGameOver(true);
          toast.error(`Game Over! Score: ${score}`);
          onScoreUpdate?.(score);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, dinoY, score, onScoreUpdate]);

  const restart = () => {
    setDinoY(0);
    setIsJumping(false);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-primary">Score: {score}</div>
      
      <div 
        className="relative w-[500px] h-[200px] bg-gradient-to-b from-sky-200 to-sky-100 rounded-lg border-2 border-primary overflow-hidden cursor-pointer"
        onClick={jump}
      >
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-amber-700 to-amber-600" />
        
        {/* Clouds */}
        <div className="absolute top-4 left-20 text-4xl opacity-50">☁️</div>
        <div className="absolute top-8 left-60 text-2xl opacity-50">☁️</div>
        <div className="absolute top-2 right-20 text-3xl opacity-50">☁️</div>

        {/* Dino */}
        <div
          className="absolute text-4xl transition-transform"
          style={{ left: 50, bottom: 40 + dinoY }}
        >
          🦖
        </div>

        {/* Obstacles */}
        {obstacles.map((obstacle, i) => (
          <div
            key={i}
            className="absolute text-3xl"
            style={{ 
              left: obstacle.x, 
              bottom: obstacle.type === 'bird' ? 80 : 40 
            }}
          >
            {obstacle.type === 'bird' ? '🦅' : '🌵'}
          </div>
        ))}

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-xl font-bold mb-2">Tap or Press Space to Start!</p>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-xl mb-4">Score: {score}</p>
              <Button onClick={restart} variant="gaming">Play Again</Button>
            </div>
          </div>
        )}
      </div>

      <Button onClick={jump} variant="gaming" size="lg" className="w-40">
        JUMP 🦘
      </Button>
      
      <p className="text-sm text-muted-foreground">Tap, click, or press Space/Up to jump</p>
    </div>
  );
};

export default DinoRun;

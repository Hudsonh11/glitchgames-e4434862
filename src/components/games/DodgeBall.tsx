import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DodgeBallProps {
  onScoreUpdate?: (score: number) => void;
}

type Ball = { x: number; y: number; vx: number; vy: number; size: number };

const DodgeBall: React.FC<DodgeBallProps> = ({ onScoreUpdate }) => {
  const [playerX, setPlayerX] = useState(180);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      setPlayerX(x => Math.max(20, x - 15));
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      setPlayerX(x => Math.min(360, x + 15));
    }
  }, [gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startGame = () => {
    setPlayerX(180);
    setBalls([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    gameLoopRef.current = window.setInterval(() => {
      // Move balls
      setBalls(prev => {
        const updated = prev
          .map(b => ({
            ...b,
            x: b.x + b.vx,
            y: b.y + b.vy
          }))
          .filter(b => b.y < 420);

        // Spawn new ball
        const spawnRate = Math.min(0.15, 0.03 + score / 1000);
        if (Math.random() < spawnRate) {
          updated.push({
            x: Math.random() * 360 + 20,
            y: -20,
            vx: (Math.random() - 0.5) * 4,
            vy: 3 + Math.random() * 3 + score / 500,
            size: 15 + Math.random() * 15
          });
        }

        return updated;
      });

      // Update score
      setScore(s => {
        const newScore = s + 1;
        if (newScore % 100 === 0) onScoreUpdate?.(newScore);
        return newScore;
      });

      // Check collision
      setBalls(prev => {
        const playerY = 360;
        const collision = prev.some(b => {
          const dx = b.x - playerX;
          const dy = b.y - playerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < (b.size / 2 + 15);
        });

        if (collision) {
          setGameOver(true);
          onScoreUpdate?.(score);
          toast.error(`Game Over! Score: ${score}`);
        }
        return prev;
      });
    }, 30);

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, playerX, score, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-primary">Score: {score}</div>

      <div 
        className="relative w-[400px] h-[400px] max-w-full bg-gradient-to-b from-indigo-900 to-purple-900 rounded-xl overflow-hidden border-2 border-primary touch-none"
        style={{ aspectRatio: '1/1' }}
      >
        {/* Stars background */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}

        {/* Balls */}
        {balls.map((ball, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-lg"
            style={{
              left: ball.x - ball.size / 2,
              top: ball.y - ball.size / 2,
              width: ball.size,
              height: ball.size,
              boxShadow: '0 0 10px rgba(255, 100, 0, 0.5)'
            }}
          />
        ))}

        {/* Player */}
        <div
          className="absolute text-4xl"
          style={{ left: playerX - 20, top: 340 }}
        >
          🛡️
        </div>

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-2xl mb-4 font-bold">Dodge Ball</h2>
              <p className="text-gray-300 mb-4">Avoid the falling balls!</p>
              <Button onClick={startGame} variant="gaming" size="lg">Start Game</Button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-xl mb-4">Score: {score}</p>
              <Button onClick={startGame} variant="gaming">Play Again</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={() => setPlayerX(x => Math.max(20, x - 20))} 
          size="lg"
          className="w-24"
        >
          ← Left
        </Button>
        <Button 
          onClick={() => setPlayerX(x => Math.min(360, x + 20))} 
          size="lg"
          className="w-24"
        >
          Right →
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Arrow keys or A/D to move</p>
    </div>
  );
};

export default DodgeBall;

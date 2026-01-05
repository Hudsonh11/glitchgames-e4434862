import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TempleRunProps {
  onScoreUpdate?: (score: number) => void;
}

type Lane = 0 | 1 | 2;
type Obstacle = { z: number; lane: Lane; type: 'rock' | 'fire' };

const TempleRun: React.FC<TempleRunProps> = ({ onScoreUpdate }) => {
  const [playerLane, setPlayerLane] = useState<Lane>(1);
  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();

  const moveLeft = useCallback(() => {
    if (gameOver) return;
    setPlayerLane(l => Math.max(0, l - 1) as Lane);
  }, [gameOver]);

  const moveRight = useCallback(() => {
    if (gameOver) return;
    setPlayerLane(l => Math.min(2, l + 1) as Lane);
  }, [gameOver]);

  const jump = useCallback(() => {
    if (gameOver || isJumping) return;
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, [gameOver, isJumping]);

  const slide = useCallback(() => {
    if (gameOver || isSliding) return;
    setIsSliding(true);
    setTimeout(() => setIsSliding(false), 400);
  }, [gameOver, isSliding]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') jump();
    if (e.key === 'ArrowDown' || e.key === 's') slide();
  }, [moveLeft, moveRight, jump, slide]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startGame = () => {
    setPlayerLane(1);
    setIsJumping(false);
    setIsSliding(false);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    gameLoopRef.current = window.setInterval(() => {
      // Move obstacles
      setObstacles(prev => {
        const updated = prev
          .map(o => ({ ...o, z: o.z - 15 }))
          .filter(o => o.z > -50);
        
        // Add new obstacle
        if (updated.length === 0 || updated[updated.length - 1].z < 300) {
          if (Math.random() < 0.1) {
            updated.push({
              z: 500,
              lane: Math.floor(Math.random() * 3) as Lane,
              type: Math.random() > 0.5 ? 'rock' : 'fire'
            });
          }
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
      setObstacles(prev => {
        const collision = prev.some(o => {
          if (o.z < 50 && o.z > -20 && o.lane === playerLane) {
            if (o.type === 'rock' && !isJumping) return true;
            if (o.type === 'fire' && !isSliding) return true;
          }
          return false;
        });
        
        if (collision) {
          setGameOver(true);
          onScoreUpdate?.(score);
          toast.error(`Game Over! Distance: ${score}m`);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, playerLane, isJumping, isSliding, score, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-primary">Distance: {score}m</div>

      <div 
        className="relative w-[300px] h-[400px] overflow-hidden rounded-xl border-2 border-primary"
        style={{ 
          background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 30%, #228B22 30%, #228B22 100%)',
          perspective: '500px'
        }}
      >
        {/* Path */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[350px] bg-gradient-to-b from-stone-600 to-stone-800"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg)', transformOrigin: 'bottom' }}
        >
          {/* Lane lines */}
          <div className="absolute inset-y-0 left-1/3 w-1 bg-stone-500" />
          <div className="absolute inset-y-0 left-2/3 w-1 bg-stone-500" />
        </div>

        {/* Obstacles */}
        {obstacles.map((obs, i) => {
          const scale = Math.max(0.3, 1 - obs.z / 500);
          const left = 100 + (obs.lane - 1) * 60 * scale;
          const bottom = 50 + obs.z * 0.3;
          
          return (
            <div
              key={i}
              className="absolute text-3xl transition-all"
              style={{ 
                left: left - 15,
                bottom,
                transform: `scale(${scale})`,
                opacity: scale
              }}
            >
              {obs.type === 'rock' ? '🪨' : '🔥'}
            </div>
          );
        })}

        {/* Player */}
        <div 
          className={`absolute text-4xl transition-all duration-100 ${isJumping ? '-translate-y-8' : ''} ${isSliding ? 'scale-y-50' : ''}`}
          style={{ 
            left: 100 + (playerLane - 1) * 50 - 15,
            bottom: 60
          }}
        >
          🏃
        </div>

        {!gameStarted && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Button onClick={startGame} variant="gaming" size="lg">Start Running!</Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-xl mb-4">Distance: {score}m</p>
              <Button onClick={startGame} variant="gaming">Run Again</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={moveLeft} size="lg">←</Button>
        <Button onClick={jump} variant="gaming" size="lg">Jump ↑</Button>
        <Button onClick={moveRight} size="lg">→</Button>
        <div></div>
        <Button onClick={slide} size="lg">Slide ↓</Button>
        <div></div>
      </div>

      <p className="text-sm text-muted-foreground">Jump over rocks 🪨, slide under fire 🔥</p>
    </div>
  );
};

export default TempleRun;

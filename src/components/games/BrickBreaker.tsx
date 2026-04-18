import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface Brick {
  x: number;
  y: number;
  active: boolean;
  color: string;
}

interface BrickBreakerProps {
  onScoreUpdate?: (score: number) => void;
}

const BrickBreaker: React.FC<BrickBreakerProps> = ({ onScoreUpdate }) => {
  const { updateGameStats, isLoggedIn } = useGame();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 500;
  const PADDLE_WIDTH = 80;
  const PADDLE_HEIGHT = 12;
  const BALL_SIZE = 10;
  const BRICK_WIDTH = 45;
  const BRICK_HEIGHT = 20;
  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;

  const colors = ['hsl(185, 100%, 50%)', 'hsl(320, 100%, 60%)', 'hsl(45, 100%, 55%)', 'hsl(280, 100%, 60%)', 'hsl(142, 76%, 50%)'];

  const initBricks = useCallback((): Brick[] => {
    const bricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (BRICK_WIDTH + 4) + 12,
          y: row * (BRICK_HEIGHT + 4) + 50,
          active: true,
          color: colors[row % colors.length],
        });
      }
    }
    return bricks;
  }, []);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paddleX, setPaddleX] = useState(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, vx: 3, vy: -3 });
  const [bricks, setBricks] = useState<Brick[]>(initBricks);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;

        // Wall collisions
        if (newX <= 0 || newX >= CANVAS_WIDTH - BALL_SIZE) {
          newVx = -newVx;
          newX = Math.max(0, Math.min(CANVAS_WIDTH - BALL_SIZE, newX));
        }
        if (newY <= 0) {
          newVy = -newVy;
          newY = 0;
        }

        // Paddle collision
        if (
          newY + BALL_SIZE >= CANVAS_HEIGHT - PADDLE_HEIGHT - 20 &&
          newX + BALL_SIZE >= paddleX &&
          newX <= paddleX + PADDLE_WIDTH &&
          prev.vy > 0
        ) {
          newVy = -Math.abs(newVy);
          const hitPos = (newX - paddleX) / PADDLE_WIDTH;
          newVx = (hitPos - 0.5) * 8;
          newY = CANVAS_HEIGHT - PADDLE_HEIGHT - 20 - BALL_SIZE;
        }

        // Brick collision
        setBricks(currentBricks => {
          let brickHit = false;
          const newBricks = currentBricks.map(brick => {
            if (!brick.active || brickHit) return brick;
            
            if (
              newX + BALL_SIZE >= brick.x &&
              newX <= brick.x + BRICK_WIDTH &&
              newY + BALL_SIZE >= brick.y &&
              newY <= brick.y + BRICK_HEIGHT
            ) {
              brickHit = true;
              newVy = -newVy;
              setScore(s => {
                const newScore = s + 10;
                onScoreUpdate?.(newScore);
                return newScore;
              });
              return { ...brick, active: false };
            }
            return brick;
          });
          
          return newBricks;
        });

        // Ball out of bounds
        if (newY >= CANVAS_HEIGHT) {
          setLives(l => {
            if (l <= 1) {
              setGameOver(true);
              setGameStarted(false);
              
              if (isLoggedIn) {
                const timePlayed = Math.floor((Date.now() - startTime) / 1000);
                updateGameStats('brick-breaker', score, timePlayed);
              }
              
              toast({
                title: 'Game Over!',
                description: `Final score: ${score}`,
                variant: 'destructive',
              });
            }
            return l - 1;
          });
          return { 
            x: CANVAS_WIDTH / 2, 
            y: CANVAS_HEIGHT - 100, 
            vx: 3 * (Math.random() > 0.5 ? 1 : -1), 
            vy: -3 
          };
        }

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, paddleX, score, isLoggedIn, startTime, updateGameStats, toast, onScoreUpdate]);

  // Check win condition
  useEffect(() => {
    if (bricks.every(b => !b.active) && gameStarted) {
      setGameStarted(false);
      
      if (isLoggedIn) {
        const timePlayed = Math.floor((Date.now() - startTime) / 1000);
        updateGameStats('brick-breaker', score + 500, timePlayed);
      }
      
      toast({
        title: '🎉 You Win!',
        description: `All bricks cleared! Score: ${score + 500}`,
      });
    }
  }, [bricks, gameStarted, score, isLoggedIn, startTime, updateGameStats, toast]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !gameStarted) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - PADDLE_WIDTH / 2;
      setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current || !gameStarted) return;
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = CANVAS_WIDTH / rect.width;
      const x = (e.touches[0].clientX - rect.left) * scale - PADDLE_WIDTH / 2;
      setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameStarted]);

  const restart = () => {
    setScore(0);
    setLives(3);
    setBricks(initBricks());
    setBall({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, vx: 3, vy: -3 });
    setPaddleX(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stats */}
      <div className="flex gap-8 text-lg font-display">
        <span>Score: <span className="text-primary font-bold">{score}</span></span>
        <span>Lives: <span className="text-destructive font-bold">{'❤️'.repeat(lives)}</span></span>
      </div>

      {/* Game Area */}
      <div
        ref={canvasRef}
        className="relative bg-background rounded-xl border-2 border-primary overflow-hidden cursor-none touch-none max-w-full"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
      >
        {/* Bricks */}
        {bricks.map((brick, i) => brick.active && (
          <div
            key={i}
            className="absolute rounded transition-all"
            style={{
              left: brick.x,
              top: brick.y,
              width: BRICK_WIDTH,
              height: BRICK_HEIGHT,
              backgroundColor: brick.color,
              boxShadow: `0 0 10px ${brick.color}50`,
            }}
          />
        ))}

        {/* Paddle */}
        <div
          className="absolute bg-primary rounded-full shadow-neon"
          style={{
            left: paddleX,
            bottom: 20,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
          }}
        />

        {/* Ball */}
        {gameStarted && (
          <div
            className="absolute bg-warning rounded-full shadow-neon-gold"
            style={{
              left: ball.x,
              top: ball.y,
              width: BALL_SIZE,
              height: BALL_SIZE,
            }}
          />
        )}

        {/* Start overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Button onClick={restart} variant="gaming" className="gap-2">
              <Play className="w-4 h-4" />
              {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Move mouse/finger to control paddle. Break all bricks!
      </p>
    </div>
  );
};

export default BrickBreaker;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface PongGameProps {
  onScoreUpdate?: (score: number) => void;
}

const PongGame: React.FC<PongGameProps> = ({ onScoreUpdate }) => {
  const { updateGameStats, isLoggedIn } = useGame();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 300;
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 60;
  const BALL_SIZE = 10;

  const [gameStarted, setGameStarted] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerY, setPlayerY] = useState(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [aiY, setAiY] = useState(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [ball, setBall] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: 2 });
  const [startTime] = useState(Date.now());

  const resetBall = useCallback(() => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 4,
      vy: (Math.random() - 0.5) * 4,
    });
  }, []);

  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      setBall(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;

        // Top/bottom wall collision
        if (newY <= 0 || newY >= CANVAS_HEIGHT - BALL_SIZE) {
          newVy = -newVy;
          newY = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, newY));
        }

        // Player paddle collision
        if (
          newX <= PADDLE_WIDTH + 20 &&
          newY + BALL_SIZE >= playerY &&
          newY <= playerY + PADDLE_HEIGHT
        ) {
          newVx = Math.abs(newVx) * 1.05;
          newVy = ((newY - playerY - PADDLE_HEIGHT / 2) / PADDLE_HEIGHT) * 6;
          newX = PADDLE_WIDTH + 21;
        }

        // AI paddle collision
        if (
          newX >= CANVAS_WIDTH - PADDLE_WIDTH - 20 - BALL_SIZE &&
          newY + BALL_SIZE >= aiY &&
          newY <= aiY + PADDLE_HEIGHT
        ) {
          newVx = -Math.abs(newVx) * 1.05;
          newVy = ((newY - aiY - PADDLE_HEIGHT / 2) / PADDLE_HEIGHT) * 6;
          newX = CANVAS_WIDTH - PADDLE_WIDTH - 21 - BALL_SIZE;
        }

        // Score detection
        if (newX <= 0) {
          setAiScore(s => s + 1);
          return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: 2 };
        }
        if (newX >= CANVAS_WIDTH) {
          setPlayerScore(s => {
            const newScore = s + 1;
            onScoreUpdate?.(newScore * 100);
            return newScore;
          });
          return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: -4, vy: 2 };
        }

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });

      // AI movement
      setAiY(prev => {
        const targetY = ball.y - PADDLE_HEIGHT / 2;
        const diff = targetY - prev;
        return prev + Math.sign(diff) * Math.min(Math.abs(diff), 3);
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameStarted, playerY, aiY, ball.y, onScoreUpdate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !gameStarted) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top - PADDLE_HEIGHT / 2;
      setPlayerY(Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current || !gameStarted) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top - PADDLE_HEIGHT / 2;
      setPlayerY(Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (aiScore >= 5) {
      setGameStarted(false);
      const finalScore = playerScore * 100;
      
      if (isLoggedIn) {
        const timePlayed = Math.floor((Date.now() - startTime) / 1000);
        updateGameStats('pong', finalScore, timePlayed);
      }
      
      toast({
        title: 'Game Over!',
        description: `AI wins! Your score: ${finalScore}`,
        variant: 'destructive',
      });
    }
  }, [aiScore, playerScore, isLoggedIn, startTime, updateGameStats, toast]);

  const restart = () => {
    setPlayerScore(0);
    setAiScore(0);
    resetBall();
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Scores */}
      <div className="flex gap-12 text-2xl font-display font-bold">
        <span className="text-primary">You: {playerScore}</span>
        <span className="text-destructive">AI: {aiScore}</span>
      </div>

      {/* Game Area */}
      <div
        ref={canvasRef}
        className="relative bg-background rounded-xl border-2 border-primary overflow-hidden cursor-none"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-primary/30 border-dashed" />
        
        {/* Player paddle */}
        <div
          className="absolute bg-primary rounded shadow-neon"
          style={{
            left: 20,
            top: playerY,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
          }}
        />
        
        {/* AI paddle */}
        <div
          className="absolute bg-destructive rounded"
          style={{
            right: 20,
            top: aiY,
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
              {playerScore > 0 || aiScore > 0 ? 'Play Again' : 'Start Game'}
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Move mouse/finger to control paddle. First to 5 wins!
      </p>
    </div>
  );
};

export default PongGame;

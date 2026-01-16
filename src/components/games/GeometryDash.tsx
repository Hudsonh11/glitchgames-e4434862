import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';
import { Pause, Play, RotateCcw } from 'lucide-react';

const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const GAME_SPEED = 6;
const GROUND_Y = 350;

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'spike' | 'block';
}

const GeometryDash = forwardRef<HTMLDivElement, object>((_, ref) => {
  const { updateGameStats, addCoins, unlockAchievement } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const playerRef = useRef({ y: GROUND_Y - 40, velocity: 0, isJumping: false });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const animationRef = useRef<number>();
  const lastObstacleRef = useRef(0);

  const jump = useCallback(() => {
    if (!playerRef.current.isJumping && !isPaused && isPlaying) {
      playerRef.current.velocity = JUMP_FORCE;
      playerRef.current.isJumping = true;
    }
  }, [isPaused, isPlaying]);

  const resetGame = useCallback(() => {
    playerRef.current = { y: GROUND_Y - 40, velocity: 0, isJumping: false };
    obstaclesRef.current = [];
    lastObstacleRef.current = 0;
    setScore(0);
    setGameOver(false);
    setStartTime(Date.now());
  }, []);

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };

  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('geometry-dash', score, timePlayed);
    addCoins(Math.floor(score / 5));
    
    if (score > highScore) {
      setHighScore(score);
    }
    
    if (score >= 50) unlockAchievement('gdash_50');
    if (score >= 100) unlockAchievement('gdash_100');
  }, [score, highScore, startTime, updateGameStats, addCoins, unlockAchievement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, isPlaying, gameOver]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = 'hsl(240, 15%, 6%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = 'hsl(240, 15%, 15%)';
      ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

      // Draw grid lines
      ctx.strokeStyle = 'hsl(240, 15%, 20%)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Update player
      const player = playerRef.current;
      player.velocity += GRAVITY;
      player.y += player.velocity;

      if (player.y >= GROUND_Y - 40) {
        player.y = GROUND_Y - 40;
        player.velocity = 0;
        player.isJumping = false;
      }

      // Draw player
      ctx.save();
      ctx.translate(80, player.y + 20);
      ctx.rotate(player.isJumping ? (player.velocity * 0.05) : 0);
      
      const gradient = ctx.createLinearGradient(-20, -20, 20, 20);
      gradient.addColorStop(0, 'hsl(185, 100%, 50%)');
      gradient.addColorStop(1, 'hsl(280, 100%, 60%)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-20, -20, 40, 40);
      
      ctx.strokeStyle = 'hsl(185, 100%, 70%)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-20, -20, 40, 40);
      ctx.restore();

      // Update and draw obstacles
      const obstacles = obstaclesRef.current;
      
      // Spawn new obstacles
      if (Date.now() - lastObstacleRef.current > 1500) {
        const type = Math.random() > 0.5 ? 'spike' : 'block';
        obstacles.push({
          x: canvas.width,
          width: type === 'spike' ? 30 : 40,
          height: type === 'spike' ? 40 : 40,
          type,
        });
        lastObstacleRef.current = Date.now();
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= GAME_SPEED;

        // Draw obstacle
        const obs = obstacles[i];
        if (obs.type === 'spike') {
          ctx.fillStyle = 'hsl(0, 84%, 60%)';
          ctx.beginPath();
          ctx.moveTo(obs.x, GROUND_Y);
          ctx.lineTo(obs.x + obs.width / 2, GROUND_Y - obs.height);
          ctx.lineTo(obs.x + obs.width, GROUND_Y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = 'hsl(320, 100%, 60%)';
          ctx.fillRect(obs.x, GROUND_Y - obs.height, obs.width, obs.height);
        }

        // Collision detection
        const playerBox = {
          x: 60,
          y: player.y,
          width: 40,
          height: 40,
        };

        let obsBox;
        if (obs.type === 'spike') {
          obsBox = {
            x: obs.x + 5,
            y: GROUND_Y - obs.height + 10,
            width: obs.width - 10,
            height: obs.height - 10,
          };
        } else {
          obsBox = {
            x: obs.x,
            y: GROUND_Y - obs.height,
            width: obs.width,
            height: obs.height,
          };
        }

        if (
          playerBox.x < obsBox.x + obsBox.width &&
          playerBox.x + playerBox.width > obsBox.x &&
          playerBox.y < obsBox.y + obsBox.height &&
          playerBox.y + playerBox.height > obsBox.y
        ) {
          handleGameOver();
          return;
        }

        // Remove off-screen obstacles and add score
        if (obs.x + obs.width < 0) {
          obstacles.splice(i, 1);
          setScore(prev => prev + 10);
        }
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPaused, handleGameOver]);

  const handleQuit = () => {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('geometry-dash', score, timePlayed);
    addCoins(Math.floor(score / 5));
    window.history.back();
  };

  return (
    <div ref={ref} className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Geometry Dash</h1>
            <p className="text-muted-foreground text-sm">Jump over obstacles, survive as long as you can!</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsPaused(true)}>
            <Pause className="w-5 h-5" />
          </Button>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-card border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Score</p>
            <p className="font-display text-3xl font-bold text-primary">{score}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Best</p>
            <p className="font-display text-3xl font-bold text-warning">{highScore}</p>
          </div>
        </div>

        {/* Game Canvas */}
        <div 
          className="relative rounded-xl overflow-hidden border border-border mb-6"
          onClick={() => {
            if (!isPlaying && !gameOver) {
              startGame();
            } else {
              jump();
            }
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full h-auto cursor-pointer"
          />

          {/* Start Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Play className="w-16 h-16 text-primary mb-4 animate-pulse-glow" />
              <p className="font-display text-xl font-bold mb-2">Tap or Press Space to Start</p>
              <p className="text-muted-foreground">Tap/Space to jump over obstacles</p>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <h2 className="font-display text-3xl font-bold text-destructive mb-2">Game Over!</h2>
              <p className="font-display text-xl mb-4">Score: {score}</p>
              <div className="flex gap-3">
                <Button variant="gaming" onClick={startGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button variant="outline" onClick={handleQuit}>
                  Quit
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Info */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-2">Controls</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tap screen or press Space/Up Arrow to jump</li>
            <li>• Avoid spikes and blocks</li>
            <li>• Survive as long as possible!</li>
          </ul>
        </div>
      </div>

      {/* Pause Menu */}
      <GamePauseMenu
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={() => {
          resetGame();
          setIsPlaying(true);
          setIsPaused(false);
        }}
        onQuit={handleQuit}
        score={score}
      />
    </div>
  );
});

GeometryDash.displayName = 'GeometryDash';

export default GeometryDash;

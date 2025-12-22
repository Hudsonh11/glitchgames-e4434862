import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';
import { Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';

const LANES = 3;
const LANE_WIDTH = 100;
const CAR_SIZE = 60;
const GAME_SPEED_BASE = 5;

interface Car {
  lane: number;
  y: number;
  color: string;
}

const RacingGame: React.FC = () => {
  const { updateGameStats, addCoins, unlockAchievement } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const playerLaneRef = useRef(1);
  const enemyCarsRef = useRef<Car[]>([]);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const roadOffsetRef = useRef(0);
  const scoreRef = useRef(0);

  const moveLeft = useCallback(() => {
    if (playerLaneRef.current > 0 && !isPaused && isPlaying) {
      playerLaneRef.current--;
    }
  }, [isPaused, isPlaying]);

  const moveRight = useCallback(() => {
    if (playerLaneRef.current < LANES - 1 && !isPaused && isPlaying) {
      playerLaneRef.current++;
    }
  }, [isPaused, isPlaying]);

  const resetGame = useCallback(() => {
    playerLaneRef.current = 1;
    enemyCarsRef.current = [];
    lastSpawnRef.current = 0;
    roadOffsetRef.current = 0;
    scoreRef.current = 0;
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
    
    const finalScore = scoreRef.current;
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('racing', finalScore, timePlayed);
    addCoins(Math.floor(finalScore / 10));
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    
    if (finalScore >= 100) unlockAchievement('racing_100');
    if (finalScore >= 500) unlockAchievement('racing_500');
  }, [highScore, startTime, updateGameStats, addCoins, unlockAchievement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        moveLeft();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        moveRight();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, isPlaying, gameOver]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const roadWidth = LANE_WIDTH * LANES;
    const roadX = (canvas.width - roadWidth) / 2;
    const gameSpeed = GAME_SPEED_BASE + Math.floor(scoreRef.current / 100);

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = 'hsl(142, 40%, 30%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw road
      ctx.fillStyle = 'hsl(240, 10%, 20%)';
      ctx.fillRect(roadX, 0, roadWidth, canvas.height);

      // Draw road markings
      roadOffsetRef.current = (roadOffsetRef.current + gameSpeed) % 80;
      ctx.strokeStyle = 'hsl(45, 100%, 55%)';
      ctx.lineWidth = 3;
      ctx.setLineDash([40, 40]);
      
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(roadX + i * LANE_WIDTH, -40 + roadOffsetRef.current);
        ctx.lineTo(roadX + i * LANE_WIDTH, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw road edges
      ctx.strokeStyle = 'hsl(0, 0%, 100%)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(roadX, 0);
      ctx.lineTo(roadX, canvas.height);
      ctx.moveTo(roadX + roadWidth, 0);
      ctx.lineTo(roadX + roadWidth, canvas.height);
      ctx.stroke();

      // Spawn enemy cars
      if (Date.now() - lastSpawnRef.current > 1000 - Math.min(scoreRef.current, 500)) {
        const colors = ['hsl(0, 70%, 50%)', 'hsl(45, 70%, 50%)', 'hsl(200, 70%, 50%)'];
        enemyCarsRef.current.push({
          lane: Math.floor(Math.random() * LANES),
          y: -CAR_SIZE,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
        lastSpawnRef.current = Date.now();
      }

      // Update and draw enemy cars
      const enemies = enemyCarsRef.current;
      for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += gameSpeed;

        // Draw enemy car
        const ex = roadX + enemies[i].lane * LANE_WIDTH + (LANE_WIDTH - CAR_SIZE) / 2;
        const ey = enemies[i].y;
        
        ctx.fillStyle = enemies[i].color;
        ctx.beginPath();
        ctx.roundRect(ex, ey, CAR_SIZE, CAR_SIZE * 1.2, 10);
        ctx.fill();
        
        // Car details
        ctx.fillStyle = 'hsl(200, 80%, 70%)';
        ctx.fillRect(ex + 10, ey + 10, CAR_SIZE - 20, 15);

        // Collision detection
        const playerX = roadX + playerLaneRef.current * LANE_WIDTH + (LANE_WIDTH - CAR_SIZE) / 2;
        const playerY = canvas.height - CAR_SIZE * 1.5 - 20;

        if (
          playerX < ex + CAR_SIZE &&
          playerX + CAR_SIZE > ex &&
          playerY < ey + CAR_SIZE * 1.2 &&
          playerY + CAR_SIZE * 1.2 > ey
        ) {
          handleGameOver();
          return;
        }

        // Remove off-screen cars and add score
        if (enemies[i].y > canvas.height) {
          enemies.splice(i, 1);
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }
      }

      // Draw player car
      const playerX = roadX + playerLaneRef.current * LANE_WIDTH + (LANE_WIDTH - CAR_SIZE) / 2;
      const playerY = canvas.height - CAR_SIZE * 1.5 - 20;
      
      // Car body
      const gradient = ctx.createLinearGradient(playerX, playerY, playerX + CAR_SIZE, playerY + CAR_SIZE * 1.2);
      gradient.addColorStop(0, 'hsl(185, 100%, 50%)');
      gradient.addColorStop(1, 'hsl(280, 100%, 60%)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(playerX, playerY, CAR_SIZE, CAR_SIZE * 1.2, 10);
      ctx.fill();

      // Car windshield
      ctx.fillStyle = 'hsl(200, 80%, 70%)';
      ctx.fillRect(playerX + 10, playerY + CAR_SIZE * 0.7, CAR_SIZE - 20, 15);

      // Glow effect
      ctx.shadowColor = 'hsl(185, 100%, 50%)';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'hsl(185, 100%, 70%)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(playerX, playerY, CAR_SIZE, CAR_SIZE * 1.2, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

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
    updateGameStats('racing', scoreRef.current, timePlayed);
    addCoins(Math.floor(scoreRef.current / 10));
    window.history.back();
  };

  // Touch controls for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    if (direction === 'left') {
      moveLeft();
    } else {
      moveRight();
    }
  }, [moveLeft, moveRight]);

  // Swipe detection for mobile
  const touchStartX = useRef<number>(0);
  
  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleCanvasTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        moveRight();
      } else {
        moveLeft();
      }
    } else if (!isPlaying && !gameOver) {
      startGame();
    }
  }, [moveLeft, moveRight, isPlaying, gameOver]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-gradient">Neon Racer</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Swipe or tap to steer!</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsPaused(true)}>
            <Pause className="w-5 h-5" />
          </Button>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between mb-4 p-3 md:p-4 rounded-xl bg-card border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Score</p>
            <p className="font-display text-2xl md:text-3xl font-bold text-primary">{score}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Best</p>
            <p className="font-display text-2xl md:text-3xl font-bold text-warning">{highScore}</p>
          </div>
        </div>

        {/* Game Canvas with touch support */}
        <div 
          className="relative rounded-xl overflow-hidden border border-border mb-4 touch-none"
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            className="w-full h-auto"
          />

          {/* Start Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <Play className="w-12 md:w-16 h-12 md:h-16 text-primary mb-4 animate-pulse-glow" />
              <p className="font-display text-lg md:text-xl font-bold mb-2 text-center">Tap to Start</p>
              <p className="text-muted-foreground text-center text-sm">
                <span className="hidden md:inline">Use Arrow Keys or A/D to steer</span>
                <span className="md:hidden">Swipe left/right or use buttons below</span>
              </p>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-destructive mb-2">Crashed!</h2>
              <p className="font-display text-lg md:text-xl mb-4">Distance: {score}</p>
              <div className="flex gap-3">
                <Button variant="gaming" onClick={startGame}>
                  Play Again
                </Button>
                <Button variant="outline" onClick={handleQuit}>
                  Quit
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls - Large touch-friendly buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Button
            variant="gaming"
            className="h-16 md:h-20 text-lg"
            onTouchStart={(e) => handleTouchStart(e, 'left')}
            onClick={moveLeft}
            disabled={!isPlaying || isPaused}
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </Button>
          
          <Button
            variant={isPlaying ? 'outline' : 'gaming'}
            className="h-16 md:h-20 text-lg"
            onClick={() => {
              if (!isPlaying && !gameOver) {
                startGame();
              } else if (isPlaying) {
                setIsPaused(true);
              }
            }}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="gaming"
            className="h-16 md:h-20 text-lg"
            onTouchStart={(e) => handleTouchStart(e, 'right')}
            onClick={moveRight}
            disabled={!isPlaying || isPaused}
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </Button>
        </div>

        {/* Controls Info - condensed for mobile */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-1 text-sm">Controls</h3>
          <p className="text-xs text-muted-foreground">
            <span className="md:hidden">Swipe on game area or tap buttons • Avoid cars!</span>
            <span className="hidden md:inline">Arrow keys or A/D to change lanes • Avoid other cars!</span>
          </p>
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
};

export default RacingGame;

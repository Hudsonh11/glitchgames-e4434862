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

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Neon Racer</h1>
            <p className="text-muted-foreground text-sm">Dodge traffic, go the distance!</p>
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
        <div className="relative rounded-xl overflow-hidden border border-border mb-6">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            className="w-full h-auto"
          />

          {/* Start Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Play className="w-16 h-16 text-primary mb-4 animate-pulse-glow" />
              <p className="font-display text-xl font-bold mb-2">Press Space to Start</p>
              <p className="text-muted-foreground text-center px-4">
                Use Arrow Keys or A/D to steer<br />
                Or tap the buttons below on mobile
              </p>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <h2 className="font-display text-3xl font-bold text-destructive mb-2">Crashed!</h2>
              <p className="font-display text-xl mb-4">Distance: {score}</p>
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

        {/* Mobile Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            variant="gaming"
            size="xl"
            onClick={moveLeft}
            disabled={!isPlaying || isPaused}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            variant="gaming"
            size="xl"
            onClick={moveRight}
            disabled={!isPlaying || isPaused}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>

        {/* Controls Info */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-2">Controls</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Arrow keys or A/D to change lanes</li>
            <li>• Tap buttons on mobile</li>
            <li>• Avoid other cars!</li>
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
};

export default RacingGame;

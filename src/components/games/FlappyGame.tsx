import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_SPEED = 3;

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

const FlappyGame: React.FC = () => {
  const { addCoins, soundSettings, updateGameStats } = useGame();
  const soundEnabled = !soundSettings.isMuted;
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  const playSound = useCallback((type: 'flap' | 'score' | 'die') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'flap') {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'score') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(784, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [soundEnabled]);

  const resetGame = useCallback(() => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver) return;
    if (isPaused) return;
    playSound('flap');
    setBirdVelocity(JUMP_FORCE);
  }, [isPlaying, gameOver, isPaused, playSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying) {
          resetGame();
        } else {
          jump();
        }
      }
      if (e.code === 'Escape' && isPlaying && !gameOver) {
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, jump, resetGame]);

  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const gameLoop = () => {
      // Update bird
      setBirdY(prev => {
        const newY = prev + birdVelocity;
        if (newY < 0 || newY > GAME_HEIGHT - BIRD_SIZE) {
          playSound('die');
          setGameOver(true);
          setIsPlaying(false);
          const coinsEarned = score * 2;
          if (coinsEarned > 0) addCoins(coinsEarned);
          updateGameStats('flappy', score, 0);
          return prev;
        }
        return newY;
      });
      setBirdVelocity(prev => prev + GRAVITY);

      // Update pipes
      setPipes(prev => {
        let newPipes = prev
          .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter(pipe => pipe.x > -PIPE_WIDTH);

        // Add new pipe
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - 200) {
          newPipes.push({
            x: GAME_WIDTH,
            topHeight: Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50,
            passed: false,
          });
        }

        // Check collisions and scoring
        newPipes = newPipes.map(pipe => {
          const birdLeft = 50;
          const birdRight = 50 + BIRD_SIZE;
          const birdTop = birdY;
          const birdBottom = birdY + BIRD_SIZE;

          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + PIPE_WIDTH;

          // Collision check
          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
              playSound('die');
              setGameOver(true);
              setIsPlaying(false);
              const coinsEarned = score * 2;
              if (coinsEarned > 0) addCoins(coinsEarned);
              updateGameStats('flappy', score, 0);
            }
          }

          // Score check
          if (!pipe.passed && pipeRight < birdLeft) {
            playSound('score');
            setScore(s => s + 1);
            return { ...pipe, passed: true };
          }

          return pipe;
        });

        return newPipes;
      });

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, isPaused, gameOver, birdVelocity, birdY, score, playSound, addCoins, updateGameStats]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="font-display text-2xl font-bold text-warning">{score}</p>
          </div>
        </div>
      </div>

      <div 
        ref={gameRef}
        className="relative bg-gradient-to-b from-primary/20 to-primary/5 rounded-xl border border-border overflow-hidden cursor-pointer"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={jump}
        onTouchStart={jump}
      >
        {/* Bird */}
        <div
          className="absolute transition-transform duration-75"
          style={{
            left: 50,
            top: birdY,
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            transform: `rotate(${Math.min(birdVelocity * 3, 45)}deg)`,
          }}
        >
          <div className="w-full h-full bg-warning rounded-full shadow-[0_0_15px_hsl(var(--warning))]">
            <div className="absolute right-1 top-2 w-2 h-2 bg-background rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-2 bg-destructive rounded-r-full" />
          </div>
        </div>

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <React.Fragment key={index}>
            {/* Top pipe */}
            <div
              className="absolute bg-success border-2 border-success/50 rounded-b-lg"
              style={{
                left: pipe.x,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.topHeight,
                boxShadow: '0 0 10px hsl(var(--success) / 0.5)',
              }}
            >
              <div 
                className="absolute -left-1 bottom-0 w-[calc(100%+8px)] h-6 bg-success border-2 border-success/50 rounded"
              />
            </div>
            {/* Bottom pipe */}
            <div
              className="absolute bg-success border-2 border-success/50 rounded-t-lg"
              style={{
                left: pipe.x,
                top: pipe.topHeight + PIPE_GAP,
                width: PIPE_WIDTH,
                height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP,
                boxShadow: '0 0 10px hsl(var(--success) / 0.5)',
              }}
            >
              <div 
                className="absolute -left-1 top-0 w-[calc(100%+8px)] h-6 bg-success border-2 border-success/50 rounded"
              />
            </div>
          </React.Fragment>
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted" />

        {/* Overlay */}
        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
            {gameOver ? (
              <>
                <h2 className="font-display text-2xl font-bold text-destructive">Game Over!</h2>
                <p className="text-muted-foreground">Score: {score}</p>
                <Button variant="gaming" onClick={resetGame} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-gradient">FLAPPY BIRD</h2>
                <p className="text-muted-foreground text-sm text-center">
                  Tap or press Space to fly!
                </p>
                <Button variant="gaming" onClick={resetGame} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Tap the screen or press Space to jump
      </p>

      <GamePauseMenu
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={resetGame}
        onQuit={() => window.location.href = '/'}
        score={score}
      />
    </div>
  );
};

export default FlappyGame;

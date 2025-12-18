import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';

const GRID_SIZE = 20;
const CELL_SIZE = 18;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const SnakeGame: React.FC = () => {
  const { addCoins, soundSettings, updateGameStats } = useGame();
  const soundEnabled = !soundSettings.isMuted;
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef(direction);
  const gameRef = useRef<HTMLDivElement>(null);

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const playSound = useCallback((type: 'eat' | 'die') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'eat') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(659, audioContext.currentTime + 0.1);
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
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 10 });
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setSpeed(INITIAL_SPEED);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') {
            e.preventDefault();
            setDirection('UP');
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') {
            e.preventDefault();
            setDirection('DOWN');
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') {
            e.preventDefault();
            setDirection('LEFT');
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') {
            e.preventDefault();
            setDirection('RIGHT');
          }
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused]);

  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        let newHead: Position;

        switch (directionRef.current) {
          case 'UP':
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case 'DOWN':
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case 'LEFT':
            newHead = { x: head.x - 1, y: head.y };
            break;
          case 'RIGHT':
            newHead = { x: head.x + 1, y: head.y };
            break;
        }

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          playSound('die');
          setGameOver(true);
          setIsPlaying(false);
          const coinsEarned = Math.floor(score / 5);
          if (coinsEarned > 0) addCoins(coinsEarned);
          updateGameStats('snake', score, 0);
          return prev;
        }

        // Check self collision
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          playSound('die');
          setGameOver(true);
          setIsPlaying(false);
          const coinsEarned = Math.floor(score / 5);
          if (coinsEarned > 0) addCoins(coinsEarned);
          updateGameStats('snake', score, 0);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          playSound('eat');
          setScore(s => s + 10);
          setFood(generateFood());
          setSpeed(s => Math.max(50, s - 2));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, gameOver, speed, food, generateFood, playSound, score, addCoins, updateGameStats]);

  const handleMobileControl = (dir: Direction) => {
    if (!isPlaying || isPaused) return;
    if (
      (dir === 'UP' && directionRef.current !== 'DOWN') ||
      (dir === 'DOWN' && directionRef.current !== 'UP') ||
      (dir === 'LEFT' && directionRef.current !== 'RIGHT') ||
      (dir === 'RIGHT' && directionRef.current !== 'LEFT')
    ) {
      setDirection(dir);
    }
  };

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
            <p className="font-display text-xl font-bold text-success">{score}</p>
          </div>
        </div>
      </div>

      <div 
        ref={gameRef}
        className="relative bg-card rounded-xl border border-border overflow-hidden"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        />

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0 ? 'bg-success shadow-[0_0_10px_hsl(var(--success))]' : 'bg-success/70'
            }`}
            style={{
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-destructive rounded-full animate-pulse shadow-[0_0_10px_hsl(var(--destructive))]"
          style={{
            left: food.x * CELL_SIZE + 2,
            top: food.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        />

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
                <h2 className="font-display text-2xl font-bold text-gradient">SNAKE</h2>
                <p className="text-muted-foreground text-sm">Use arrow keys or WASD</p>
                <Button variant="gaming" onClick={resetGame} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-6 grid grid-cols-3 gap-2 w-40">
        <div />
        <Button variant="outline" size="icon" onClick={() => handleMobileControl('UP')}>
          <ArrowUp className="w-5 h-5" />
        </Button>
        <div />
        <Button variant="outline" size="icon" onClick={() => handleMobileControl('LEFT')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)}>
          <Play className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleMobileControl('RIGHT')}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div />
        <Button variant="outline" size="icon" onClick={() => handleMobileControl('DOWN')}>
          <ArrowDown className="w-5 h-5" />
        </Button>
        <div />
      </div>

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

export default SnakeGame;

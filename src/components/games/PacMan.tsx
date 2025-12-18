import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';

const GRID_SIZE = 15;
const CELL_SIZE = 24;
const INITIAL_SPEED = 200;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const WALLS = [
  // Top border
  ...Array.from({ length: 15 }, (_, i) => ({ x: i, y: 0 })),
  // Bottom border
  ...Array.from({ length: 15 }, (_, i) => ({ x: i, y: 14 })),
  // Left border
  ...Array.from({ length: 15 }, (_, i) => ({ x: 0, y: i })),
  // Right border
  ...Array.from({ length: 15 }, (_, i) => ({ x: 14, y: i })),
  // Internal walls
  { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
  { x: 10, y: 2 }, { x: 11, y: 2 }, { x: 12, y: 2 },
  { x: 2, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
  { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 12, y: 4 },
  { x: 2, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 12, y: 6 },
  { x: 4, y: 7 }, { x: 10, y: 7 },
  { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 12, y: 8 },
  { x: 2, y: 10 }, { x: 4, y: 10 }, { x: 5, y: 10 }, { x: 6, y: 10 },
  { x: 8, y: 10 }, { x: 9, y: 10 }, { x: 10, y: 10 }, { x: 12, y: 10 },
  { x: 2, y: 12 }, { x: 3, y: 12 }, { x: 4, y: 12 },
  { x: 10, y: 12 }, { x: 11, y: 12 }, { x: 12, y: 12 },
];

const isWall = (pos: Position) => WALLS.some(w => w.x === pos.x && w.y === pos.y);

const generateDots = () => {
  const dots: Position[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!isWall({ x, y }) && !(x === 7 && y === 7)) {
        dots.push({ x, y });
      }
    }
  }
  return dots;
};

const PacMan: React.FC = () => {
  const { addCoins, soundSettings, updateGameStats, user } = useGame();
  const soundEnabled = !soundSettings.isMuted;
  const [pacman, setPacman] = useState<Position>({ x: 7, y: 7 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [ghosts, setGhosts] = useState<Position[]>([
    { x: 1, y: 1 },
    { x: 13, y: 1 },
    { x: 1, y: 13 },
    { x: 13, y: 13 },
  ]);
  const [dots, setDots] = useState<Position[]>(generateDots());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lives, setLives] = useState(3);
  const gameRef = useRef<HTMLDivElement>(null);

  const playSound = useCallback((type: 'eat' | 'die' | 'win') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'eat') {
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
    } else if (type === 'die') {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'win') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [soundEnabled]);

  const resetGame = useCallback(() => {
    setPacman({ x: 7, y: 7 });
    setDirection('RIGHT');
    setGhosts([
      { x: 1, y: 1 },
      { x: 13, y: 1 },
      { x: 1, y: 13 },
      { x: 13, y: 13 },
    ]);
    setDots(generateDots());
    setScore(0);
    setGameOver(false);
    setLives(3);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const moveGhost = useCallback((ghost: Position): Position => {
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    
    const validMoves = directions.filter(d => {
      const newPos = { x: ghost.x + d.x, y: ghost.y + d.y };
      return !isWall(newPos) && newPos.x >= 0 && newPos.x < GRID_SIZE && newPos.y >= 0 && newPos.y < GRID_SIZE;
    });

    if (validMoves.length === 0) return ghost;
    
    // Move towards pacman with some randomness
    if (Math.random() > 0.3) {
      const towardsPacman = validMoves.reduce((best, move) => {
        const newPos = { x: ghost.x + move.x, y: ghost.y + move.y };
        const bestPos = { x: ghost.x + best.x, y: ghost.y + best.y };
        const newDist = Math.abs(newPos.x - pacman.x) + Math.abs(newPos.y - pacman.y);
        const bestDist = Math.abs(bestPos.x - pacman.x) + Math.abs(bestPos.y - pacman.y);
        return newDist < bestDist ? move : best;
      });
      return { x: ghost.x + towardsPacman.x, y: ghost.y + towardsPacman.y };
    }
    
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { x: ghost.x + randomMove.x, y: ghost.y + randomMove.y };
  }, [pacman]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setDirection('RIGHT');
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

  // Game loop
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;

    const moveInterval = setInterval(() => {
      setPacman(prev => {
        let newPos = { ...prev };
        
        switch (direction) {
          case 'UP':
            newPos.y = Math.max(0, prev.y - 1);
            break;
          case 'DOWN':
            newPos.y = Math.min(GRID_SIZE - 1, prev.y + 1);
            break;
          case 'LEFT':
            newPos.x = Math.max(0, prev.x - 1);
            break;
          case 'RIGHT':
            newPos.x = Math.min(GRID_SIZE - 1, prev.x + 1);
            break;
        }

        if (isWall(newPos)) return prev;
        return newPos;
      });

      setGhosts(prev => prev.map(moveGhost));
    }, INITIAL_SPEED);

    return () => clearInterval(moveInterval);
  }, [isPlaying, isPaused, gameOver, direction, moveGhost]);

  // Check collisions and dots
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    // Check ghost collision
    const hitGhost = ghosts.some(g => g.x === pacman.x && g.y === pacman.y);
    if (hitGhost) {
      playSound('die');
      if (lives <= 1) {
        setGameOver(true);
        setIsPlaying(false);
        const coinsEarned = Math.floor(score / 10);
        if (coinsEarned > 0) addCoins(coinsEarned);
        updateGameStats('pac-man', score, 0);
      } else {
        setLives(prev => prev - 1);
        setPacman({ x: 7, y: 7 });
      }
      return;
    }

    // Check dot collection
    const dotIndex = dots.findIndex(d => d.x === pacman.x && d.y === pacman.y);
    if (dotIndex !== -1) {
      playSound('eat');
      setDots(prev => prev.filter((_, i) => i !== dotIndex));
      setScore(prev => prev + 10);
    }

    // Check win condition
    if (dots.length === 0) {
      playSound('win');
      setGameOver(true);
      setIsPlaying(false);
      const coinsEarned = Math.floor(score / 5) + 50;
      addCoins(coinsEarned);
      updateGameStats('pac-man', score, 0);
    }
  }, [pacman, ghosts, dots, isPlaying, gameOver, lives, score, playSound, addCoins, updateGameStats]);

  const handleMobileControl = (dir: Direction) => {
    if (!isPlaying || isPaused) return;
    setDirection(dir);
  };

  const getPacmanRotation = () => {
    switch (direction) {
      case 'UP': return 'rotate-[-90deg]';
      case 'DOWN': return 'rotate-90';
      case 'LEFT': return 'rotate-180';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="font-display text-xl font-bold text-warning">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lives</p>
              <p className="font-display text-xl font-bold text-warning">{lives}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={gameRef}
        className="relative bg-card rounded-xl border border-border overflow-hidden"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {/* Walls */}
        {WALLS.map((wall, i) => (
          <div
            key={`wall-${i}`}
            className="absolute bg-primary/30 border border-primary/50"
            style={{
              left: wall.x * CELL_SIZE,
              top: wall.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        ))}

        {/* Dots */}
        {dots.map((dot, i) => (
          <div
            key={`dot-${i}`}
            className="absolute bg-warning rounded-full"
            style={{
              left: dot.x * CELL_SIZE + CELL_SIZE / 2 - 3,
              top: dot.y * CELL_SIZE + CELL_SIZE / 2 - 3,
              width: 6,
              height: 6,
            }}
          />
        ))}

        {/* Pac-Man */}
        <div
          className={`absolute transition-all duration-100 ${getPacmanRotation()}`}
          style={{
            left: pacman.x * CELL_SIZE + 2,
            top: pacman.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        >
          <div className="w-full h-full bg-warning rounded-full relative overflow-hidden">
            <div 
              className="absolute bg-background animate-pulse"
              style={{
                right: 0,
                top: '25%',
                width: '50%',
                height: '50%',
                clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
              }}
            />
          </div>
        </div>

        {/* Ghosts */}
        {ghosts.map((ghost, i) => (
          <div
            key={`ghost-${i}`}
            className="absolute transition-all duration-150"
            style={{
              left: ghost.x * CELL_SIZE + 2,
              top: ghost.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          >
            <div 
              className="w-full h-full rounded-t-full"
              style={{
                backgroundColor: ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))'][i],
              }}
            >
              <div className="flex justify-center gap-1 pt-1">
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        ))}

        {/* Game Over / Start Overlay */}
        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
            {gameOver ? (
              <>
                <h2 className="font-display text-2xl font-bold text-gradient">
                  {dots.length === 0 ? 'You Win!' : 'Game Over!'}
                </h2>
                <p className="text-muted-foreground">Final Score: {score}</p>
                <Button variant="gaming" onClick={resetGame} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-gradient">PAC-MAN</h2>
                <p className="text-muted-foreground text-sm text-center">
                  Eat all dots while avoiding ghosts!
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

      {/* Mobile Controls */}
      <div className="mt-6 grid grid-cols-3 gap-2 w-40">
        <div />
        <Button
          variant="outline"
          size="icon"
          onTouchStart={() => handleMobileControl('UP')}
          onClick={() => handleMobileControl('UP')}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          onTouchStart={() => handleMobileControl('LEFT')}
          onClick={() => handleMobileControl('LEFT')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => isPlaying && setIsPaused(!isPaused)}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onTouchStart={() => handleMobileControl('RIGHT')}
          onClick={() => handleMobileControl('RIGHT')}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          onTouchStart={() => handleMobileControl('DOWN')}
          onClick={() => handleMobileControl('DOWN')}
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
        <div />
      </div>

      {/* Pause Menu */}
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

export default PacMan;

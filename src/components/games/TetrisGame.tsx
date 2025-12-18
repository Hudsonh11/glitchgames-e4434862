import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, ArrowDown, ArrowRight, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: 'hsl(var(--primary))' },
  O: { shape: [[1, 1], [1, 1]], color: 'hsl(var(--warning))' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'hsl(var(--secondary))' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'hsl(var(--success))' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'hsl(var(--destructive))' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'hsl(var(--primary))' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'hsl(var(--accent))' },
};

type TetrominoType = keyof typeof TETROMINOES;
type Board = (string | null)[][];

const createEmptyBoard = (): Board => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

const TetrisGame: React.FC = () => {
  const { addCoins, soundSettings, updateGameStats } = useGame();
  const soundEnabled = !soundSettings.isMuted;
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<{ type: TetrominoType; shape: number[][]; x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const dropIntervalRef = useRef<number | null>(null);

  const playSound = useCallback((type: 'drop' | 'clear' | 'die') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'drop') {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
    } else if (type === 'clear') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1047, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [soundEnabled]);

  const getRandomPiece = useCallback(() => {
    const types = Object.keys(TETROMINOES) as TetrominoType[];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      type,
      shape: TETROMINOES[type].shape.map(row => [...row]),
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOES[type].shape[0].length / 2),
      y: 0,
    };
  }, []);

  const isValidMove = useCallback((piece: typeof currentPiece, boardState: Board) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
          if (newY >= 0 && boardState[newY][newX]) return false;
        }
      }
    }
    return true;
  }, []);

  const mergePieceToBoard = useCallback((piece: typeof currentPiece, boardState: Board): Board => {
    if (!piece) return boardState;
    const newBoard = boardState.map(row => [...row]);
    const color = TETROMINOES[piece.type].color;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = color;
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((boardState: Board): { board: Board; linesCleared: number } => {
    const newBoard = boardState.filter(row => row.some(cell => !cell));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { board: newBoard, linesCleared };
  }, []);

  const rotatePiece = useCallback((piece: typeof currentPiece): typeof currentPiece => {
    if (!piece) return null;
    const rotated = piece.shape[0].map((_, i) => 
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
  }, []);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
  }, [getRandomPiece]);

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPiece = { ...currentPiece, y: currentPiece.y + 1 };
    if (isValidMove(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else {
      // Lock piece
      playSound('drop');
      const newBoard = mergePieceToBoard(currentPiece, board);
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);
      
      if (linesCleared > 0) {
        playSound('clear');
        const points = [0, 100, 300, 500, 800][linesCleared] * level;
        setScore(s => s + points);
        setLines(l => {
          const newLines = l + linesCleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });
      }
      
      setBoard(clearedBoard);
      const newPiece = getRandomPiece();
      
      if (!isValidMove(newPiece, clearedBoard)) {
        playSound('die');
        setGameOver(true);
        setIsPlaying(false);
        const coinsEarned = Math.floor(score / 50);
        if (coinsEarned > 0) addCoins(coinsEarned);
        updateGameStats('tetris', score, 0);
      } else {
        setCurrentPiece(newPiece);
      }
    }
  }, [currentPiece, board, gameOver, isPaused, isValidMove, mergePieceToBoard, clearLines, getRandomPiece, level, playSound, score, addCoins, updateGameStats]);

  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return;
    
    dropIntervalRef.current = window.setInterval(moveDown, Math.max(100, 1000 - (level - 1) * 100));
    return () => {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    };
  }, [isPlaying, isPaused, gameOver, level, moveDown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || !currentPiece) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A': {
          e.preventDefault();
          const newPiece = { ...currentPiece, x: currentPiece.x - 1 };
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          break;
        }
        case 'ArrowRight':
        case 'd':
        case 'D': {
          e.preventDefault();
          const newPiece = { ...currentPiece, x: currentPiece.x + 1 };
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
          break;
        }
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W': {
          e.preventDefault();
          const rotated = rotatePiece(currentPiece);
          if (rotated && isValidMove(rotated, board)) setCurrentPiece(rotated);
          break;
        }
        case ' ':
          e.preventDefault();
          // Hard drop
          let dropPiece = { ...currentPiece };
          while (isValidMove({ ...dropPiece, y: dropPiece.y + 1 }, board)) {
            dropPiece.y++;
          }
          setCurrentPiece(dropPiece);
          break;
        case 'Escape':
          e.preventDefault();
          setIsPaused(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, currentPiece, board, isValidMove, rotatePiece, moveDown]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    if (currentPiece) {
      const color = TETROMINOES[currentPiece.type].color;
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPiece.y + y >= 0) {
            displayBoard[currentPiece.y + y][currentPiece.x + x] = color;
          }
        }
      }
    }
    return displayBoard;
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
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="font-display text-lg font-bold text-primary">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lines</p>
              <p className="font-display text-lg font-bold text-secondary">{lines}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Level</p>
              <p className="font-display text-lg font-bold text-warning">{level}</p>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="relative bg-card rounded-xl border border-border overflow-hidden"
        style={{
          width: BOARD_WIDTH * CELL_SIZE + 2,
          height: BOARD_HEIGHT * CELL_SIZE + 2,
        }}
      >
        {renderBoard().map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className="absolute border border-border/30"
              style={{
                left: x * CELL_SIZE + 1,
                top: y * CELL_SIZE + 1,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: cell || 'transparent',
                boxShadow: cell ? `0 0 5px ${cell}` : 'none',
              }}
            />
          ))
        ))}

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
                <h2 className="font-display text-2xl font-bold text-gradient">TETRIS</h2>
                <p className="text-muted-foreground text-sm text-center px-4">
                  Arrow keys to move, Up to rotate, Space to drop
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
      <div className="mt-6 flex gap-4">
        <Button variant="outline" size="icon" onClick={() => {
          if (!currentPiece || !isPlaying) return;
          const newPiece = { ...currentPiece, x: currentPiece.x - 1 };
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
        }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => {
          if (!currentPiece || !isPlaying) return;
          const rotated = rotatePiece(currentPiece);
          if (rotated && isValidMove(rotated, board)) setCurrentPiece(rotated);
        }}>
          <RotateCw className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={moveDown}>
          <ArrowDown className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => {
          if (!currentPiece || !isPlaying) return;
          const newPiece = { ...currentPiece, x: currentPiece.x + 1 };
          if (isValidMove(newPiece, board)) setCurrentPiece(newPiece);
        }}>
          <ArrowRight className="w-5 h-5" />
        </Button>
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

export default TetrisGame;

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConnectFourProps {
  onScoreUpdate?: (score: number) => void;
}

type Cell = 'red' | 'yellow' | null;
type Board = Cell[][];

const ROWS = 6;
const COLS = 7;

const ConnectFour: React.FC<ConnectFourProps> = ({ onScoreUpdate }) => {
  const [board, setBoard] = useState<Board>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [isRedTurn, setIsRedTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Cell>(null);

  const checkWinner = useCallback((board: Board, row: number, col: number): boolean => {
    const color = board[row][col];
    if (!color) return false;

    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === color) {
          count++;
        } else break;
      }
      
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === color) {
          count++;
        } else break;
      }

      if (count >= 4) return true;
    }
    return false;
  }, []);

  const findRow = (board: Board, col: number): number => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) return row;
    }
    return -1;
  };

  const computerMove = useCallback((board: Board): number => {
    // Simple AI: Try to win, then block, then random
    for (let col = 0; col < COLS; col++) {
      const row = findRow(board, col);
      if (row === -1) continue;
      
      // Check if AI can win
      const testBoard = board.map(r => [...r]);
      testBoard[row][col] = 'yellow';
      if (checkWinner(testBoard, row, col)) return col;
    }

    for (let col = 0; col < COLS; col++) {
      const row = findRow(board, col);
      if (row === -1) continue;
      
      // Check if player can win (block)
      const testBoard = board.map(r => [...r]);
      testBoard[row][col] = 'red';
      if (checkWinner(testBoard, row, col)) return col;
    }

    // Prefer center columns
    const preferredCols = [3, 2, 4, 1, 5, 0, 6];
    for (const col of preferredCols) {
      if (findRow(board, col) !== -1) return col;
    }
    return 0;
  }, [checkWinner]);

  const dropPiece = (col: number) => {
    if (gameOver || !isRedTurn) return;

    const row = findRow(board, col);
    if (row === -1) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 'red';
    setBoard(newBoard);

    if (checkWinner(newBoard, row, col)) {
      setGameOver(true);
      setWinner('red');
      onScoreUpdate?.(100);
      toast.success('You win! 🎉');
      return;
    }

    if (newBoard[0].every(c => c !== null)) {
      setGameOver(true);
      toast.info("It's a tie!");
      return;
    }

    setIsRedTurn(false);

    // Computer's turn
    setTimeout(() => {
      const aiCol = computerMove(newBoard);
      const aiRow = findRow(newBoard, aiCol);
      if (aiRow !== -1) {
        newBoard[aiRow][aiCol] = 'yellow';
        setBoard([...newBoard.map(r => [...r])]);

        if (checkWinner(newBoard, aiRow, aiCol)) {
          setGameOver(true);
          setWinner('yellow');
          toast.error('Computer wins!');
          return;
        }
      }
      setIsRedTurn(true);
    }, 500);
  };

  const restart = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setIsRedTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg font-medium">
        {gameOver 
          ? (winner ? `${winner === 'red' ? 'You' : 'Computer'} won!` : "It's a tie!")
          : (isRedTurn ? 'Your turn (🔴)' : 'Computer thinking...')}
      </div>

      <div className="bg-blue-600 p-3 rounded-xl">
        {/* Column buttons */}
        <div className="flex gap-1 mb-2">
          {Array(COLS).fill(null).map((_, col) => (
            <Button
              key={col}
              size="sm"
              variant="ghost"
              className="w-10 h-8 text-white hover:bg-blue-500"
              onClick={() => dropPiece(col)}
              disabled={gameOver || !isRedTurn || findRow(board, col) === -1}
            >
              ↓
            </Button>
          ))}
        </div>

        {/* Board */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full transition-all
                  ${cell === 'red' ? 'bg-red-500 shadow-[inset_0_-4px_0_rgb(185,28,28)]' : ''}
                  ${cell === 'yellow' ? 'bg-yellow-400 shadow-[inset_0_-4px_0_rgb(202,138,4)]' : ''}
                  ${!cell ? 'bg-blue-800' : 'animate-scale-in'}`}
              />
            ))
          )}
        </div>
      </div>

      {gameOver && (
        <Button onClick={restart} variant="gaming">
          Play Again
        </Button>
      )}

      <p className="text-sm text-muted-foreground">Click arrows to drop pieces</p>
    </div>
  );
};

export default ConnectFour;

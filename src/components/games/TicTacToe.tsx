import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TicTacToeProps {
  onScoreUpdate?: (score: number) => void;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

const TicTacToe: React.FC<TicTacToeProps> = ({ onScoreUpdate }) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [score, setScore] = useState({ wins: 0, losses: 0, ties: 0 });
  const [gameOver, setGameOver] = useState(false);

  const checkWinner = (squares: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const minimax = useCallback((squares: Board, isMaximizing: boolean): number => {
    const winner = checkWinner(squares);
    if (winner === 'O') return 10;
    if (winner === 'X') return -10;
    if (squares.every(s => s !== null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          best = Math.max(best, minimax(squares, false));
          squares[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          best = Math.min(best, minimax(squares, true));
          squares[i] = null;
        }
      }
      return best;
    }
  }, []);

  const computerMove = useCallback((squares: Board) => {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        const score = minimax(squares, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    
    if (bestMove !== -1) {
      const newBoard = [...squares];
      newBoard[bestMove] = 'O';
      return newBoard;
    }
    return squares;
  }, [minimax]);

  const handleClick = (index: number) => {
    if (board[index] || gameOver || !isXTurn) return;

    let newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner) {
      setGameOver(true);
      if (winner === 'X') {
        setScore(s => ({ ...s, wins: s.wins + 1 }));
        onScoreUpdate?.(100);
        toast.success('You win! 🎉');
      }
      return;
    }

    if (newBoard.every(s => s !== null)) {
      setGameOver(true);
      setScore(s => ({ ...s, ties: s.ties + 1 }));
      toast.info("It's a tie!");
      return;
    }

    setIsXTurn(false);

    // Computer's turn
    setTimeout(() => {
      newBoard = computerMove(newBoard);
      setBoard(newBoard);

      const aiWinner = checkWinner(newBoard);
      if (aiWinner) {
        setGameOver(true);
        setScore(s => ({ ...s, losses: s.losses + 1 }));
        toast.error('Computer wins!');
        return;
      }

      if (newBoard.every(s => s !== null)) {
        setGameOver(true);
        setScore(s => ({ ...s, ties: s.ties + 1 }));
        toast.info("It's a tie!");
        return;
      }

      setIsXTurn(true);
    }, 500);
  };

  const restart = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <div className="text-green-500 font-bold text-xl">{score.wins}</div>
          <div className="text-muted-foreground">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-500 font-bold text-xl">{score.ties}</div>
          <div className="text-muted-foreground">Ties</div>
        </div>
        <div className="text-center">
          <div className="text-red-500 font-bold text-xl">{score.losses}</div>
          <div className="text-muted-foreground">Losses</div>
        </div>
      </div>

      <div className="text-lg font-medium">
        {gameOver ? 'Game Over!' : (isXTurn ? 'Your turn (X)' : 'Computer thinking...')}
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 bg-card rounded-xl">
        {board.map((cell, index) => (
          <button
            key={index}
            className={`w-20 h-20 md:w-24 md:h-24 text-4xl md:text-5xl font-bold rounded-lg transition-all
              ${cell === 'X' ? 'text-primary' : 'text-secondary'}
              ${!cell && !gameOver && isXTurn ? 'bg-muted hover:bg-muted/80 cursor-pointer' : 'bg-muted/50'}
              ${cell ? 'animate-scale-in' : ''}`}
            onClick={() => handleClick(index)}
            disabled={!!cell || gameOver || !isXTurn}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameOver && (
        <Button onClick={restart} variant="gaming">
          Play Again
        </Button>
      )}

      <p className="text-sm text-muted-foreground">You are X, computer is O</p>
    </div>
  );
};

export default TicTacToe;

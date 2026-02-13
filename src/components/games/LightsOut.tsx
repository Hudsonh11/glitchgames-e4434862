import React, { useState, useEffect, useCallback } from 'react';

const GRID = 5;

const generateBoard = (): boolean[][] => {
  const board = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  // Make random moves to create solvable puzzle
  for (let i = 0; i < 8 + Math.floor(Math.random() * 5); i++) {
    const r = Math.floor(Math.random() * GRID);
    const c = Math.floor(Math.random() * GRID);
    toggleAt(board, r, c);
  }
  return board;
};

const toggleAt = (board: boolean[][], r: number, c: number) => {
  const dirs = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
  dirs.forEach(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
      board[nr][nc] = !board[nr][nc];
    }
  });
};

const LightsOut: React.FC = () => {
  const [board, setBoard] = useState(generateBoard);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [level, setLevel] = useState(1);

  const toggle = (r: number, c: number) => {
    if (won) return;
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      toggleAt(newBoard, r, c);
      return newBoard;
    });
    setMoves(m => m + 1);
  };

  useEffect(() => {
    if (board.every(row => row.every(cell => !cell))) {
      if (moves > 0) setWon(true);
    }
  }, [board, moves]);

  const nextLevel = () => {
    setBoard(generateBoard());
    setMoves(0);
    setWon(false);
    setLevel(l => l + 1);
  };

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full mb-4">
        <span className="text-lg font-bold text-primary">Level {level}</span>
        <span className="text-sm text-muted-foreground">Moves: {moves}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Turn off all the lights!</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
        {board.map((row, r) =>
          row.map((lit, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => toggle(r, c)}
              className={`w-14 h-14 rounded-lg transition-all duration-200 border-2 ${
                lit
                  ? 'bg-primary border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]'
                  : 'bg-muted border-border'
              }`}
            />
          ))
        )}
      </div>
      {won && (
        <div className="mt-6 text-center">
          <h3 className="text-2xl font-bold text-primary mb-2">🎉 Level Complete!</h3>
          <p className="text-muted-foreground mb-4">Solved in {moves} moves</p>
          <button onClick={nextLevel} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold">Next Level</button>
        </div>
      )}
    </div>
  );
};

export default LightsOut;

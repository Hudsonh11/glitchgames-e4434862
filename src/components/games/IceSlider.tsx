import React, { useState, useEffect, useCallback } from 'react';

type Cell = 'empty' | 'wall' | 'goal' | 'player' | 'ice';

const LEVELS: Cell[][][] = [
  // Level 1 - Simple
  [
    ['wall','wall','wall','wall','wall','wall','wall'],
    ['wall','player','ice','ice','ice','ice','wall'],
    ['wall','ice','wall','ice','wall','ice','wall'],
    ['wall','ice','ice','ice','ice','ice','wall'],
    ['wall','ice','wall','ice','wall','ice','wall'],
    ['wall','ice','ice','ice','ice','goal','wall'],
    ['wall','wall','wall','wall','wall','wall','wall'],
  ],
];

// Generate 15 procedural levels
const generateLevel = (n: number): Cell[][] => {
  const size = 7 + Math.min(n, 4);
  const grid: Cell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      if (r === 0 || r === size - 1 || c === 0 || c === size - 1) return 'wall' as Cell;
      return (Math.random() < 0.15 + n * 0.02) ? 'wall' as Cell : 'ice' as Cell;
    })
  );
  grid[1][1] = 'player';
  grid[size - 2][size - 2] = 'goal';
  return grid;
};

for (let i = 1; i < 20; i++) LEVELS.push(generateLevel(i));

interface IceSliderProps {
  onScoreUpdate?: (score: number) => void;
}

const IceSlider: React.FC<IceSliderProps> = ({ onScoreUpdate }) => {
  const [level, setLevel] = useState(0);
  const [grid, setGrid] = useState<Cell[][]>(LEVELS[0].map(r => [...r]));
  const [playerPos, setPlayerPos] = useState<[number, number]>([1, 1]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const loadLevel = useCallback((n: number) => {
    const g = (LEVELS[n] || generateLevel(n)).map(r => [...r]);
    setGrid(g);
    setWon(false);
    setMoves(0);
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < g[r].length; c++)
        if (g[r][c] === 'player') { setPlayerPos([r, c]); return; }
  }, []);

  useEffect(() => { loadLevel(level); }, [level, loadLevel]);

  const slide = useCallback((dr: number, dc: number) => {
    if (won) return;
    setGrid(prev => {
      const g = prev.map(r => [...r]);
      let [r, c] = playerPos;
      g[r][c] = 'ice';
      while (true) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= g.length || nc < 0 || nc >= g[0].length || g[nr][nc] === 'wall') break;
        if (g[nr][nc] === 'goal') { r = nr; c = nc; setWon(true); onScoreUpdate?.(Math.max(50, (level + 1) * 100 - moves)); break; }
        r = nr; c = nc;
      }
      g[r][c] = 'player';
      setPlayerPos([r, c]);
      setMoves(m => m + 1);
      return g;
    });
  }, [playerPos, won]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') slide(-1, 0);
      if (e.key === 'ArrowDown') slide(1, 0);
      if (e.key === 'ArrowLeft') slide(0, -1);
      if (e.key === 'ArrowRight') slide(0, 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slide]);

  const cellSize = Math.min(50, 350 / grid.length);
  const cellColors: Record<Cell, string> = {
    wall: 'bg-slate-700', ice: 'bg-sky-200 dark:bg-sky-900', goal: 'bg-green-400 dark:bg-green-600',
    player: 'bg-primary', empty: 'bg-muted',
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-md mb-4">
        <span className="font-bold text-primary">Level {level + 1}</span>
        <span className="text-sm text-muted-foreground">Moves: {moves}</span>
      </div>
      <div className="p-2 bg-muted/30 rounded-xl">
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div key={c} className={`${cellColors[cell]} rounded-sm border border-border/20 transition-all flex items-center justify-center`}
                style={{ width: cellSize, height: cellSize }}>
                {cell === 'player' && <span className="text-lg">🧊</span>}
                {cell === 'goal' && <span className="text-lg">⭐</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {won && (
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold text-primary">Level Complete! 🎉</h3>
          <button onClick={() => setLevel(l => l + 1)} className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold">Next Level</button>
        </div>
      )}
      <button onClick={() => loadLevel(level)} className="mt-2 text-sm text-muted-foreground underline">Reset Level</button>
    </div>
  );
};

export default IceSlider;

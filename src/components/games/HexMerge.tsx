import React, { useState } from 'react';

const COLORS: Record<number, string> = {
  2: '#4ECDC4', 4: '#45B7D1', 8: '#96CEB4', 16: '#FFEAA7',
  32: '#DDA15E', 64: '#FF6B6B', 128: '#C44569', 256: '#786FA6',
  512: '#F8A5C2', 1024: '#F78FB3', 2048: '#FFD700',
};

const GRID_SIZE = 5;
type Cell = number | null;

const initGrid = (): Cell[][] => {
  const grid: Cell[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  addRandom(grid);
  addRandom(grid);
  return grid;
};

const addRandom = (grid: Cell[][]) => {
  const empty: [number, number][] = [];
  grid.forEach((row, r) => row.forEach((cell, c) => { if (!cell) empty.push([r, c]); }));
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() > 0.9 ? 4 : 2;
};

const HexMerge: React.FC = () => {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const move = (dir: 'up' | 'down' | 'left' | 'right') => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      let points = 0;
      const merge = (line: Cell[]): Cell[] => {
        const filtered = line.filter(x => x !== null) as number[];
        const result: number[] = [];
        for (let i = 0; i < filtered.length; i++) {
          if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
            const merged = filtered[i] * 2;
            result.push(merged);
            points += merged;
            i++;
          } else {
            result.push(filtered[i]);
          }
        }
        while (result.length < GRID_SIZE) result.push(0);
        return result.map(x => x || null);
      };

      if (dir === 'left') for (let r = 0; r < GRID_SIZE; r++) newGrid[r] = merge(newGrid[r]);
      if (dir === 'right') for (let r = 0; r < GRID_SIZE; r++) newGrid[r] = merge([...newGrid[r]].reverse()).reverse();
      if (dir === 'up') for (let c = 0; c < GRID_SIZE; c++) { const col = merge(newGrid.map(r => r[c])); newGrid.forEach((r, i) => r[c] = col[i]); }
      if (dir === 'down') for (let c = 0; c < GRID_SIZE; c++) { const col = merge(newGrid.map(r => r[c]).reverse()).reverse(); newGrid.forEach((r, i) => r[c] = col[i]); }

      if (JSON.stringify(newGrid) !== JSON.stringify(prev)) addRandom(newGrid);
      setScore(s => { const n = s + points; setBest(b => Math.max(b, n)); return n; });
      return newGrid;
    });
  };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full mb-4">
        <span className="font-bold text-primary">Score: {score}</span>
        <span className="font-bold text-warning">Best: {best}</span>
      </div>
      <div className="grid gap-2 p-3 bg-muted/30 rounded-xl" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
        {grid.flat().map((cell, i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-lg transition-all"
            style={{
              backgroundColor: cell ? COLORS[cell] || '#FFD700' : 'hsl(var(--muted))',
              color: cell && cell >= 8 ? '#fff' : '#333',
              transform: cell ? 'scale(1)' : 'scale(0.9)',
            }}
          >
            {cell}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div />
        <button onClick={() => move('up')} className="px-4 py-2 bg-card border border-border rounded-lg">↑</button>
        <div />
        <button onClick={() => move('left')} className="px-4 py-2 bg-card border border-border rounded-lg">←</button>
        <button onClick={() => move('down')} className="px-4 py-2 bg-card border border-border rounded-lg">↓</button>
        <button onClick={() => move('right')} className="px-4 py-2 bg-card border border-border rounded-lg">→</button>
      </div>
      <button onClick={() => { setGrid(initGrid()); setScore(0); }} className="mt-3 text-sm text-muted-foreground underline">Reset</button>
    </div>
  );
};

export default HexMerge;

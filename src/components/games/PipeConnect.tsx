import React, { useState, useEffect } from 'react';

type PipeType = '│' | '─' | '┐' | '┌' | '┘' | '└' | '┼' | '├' | '┤' | '┬' | '┴';
const PIPE_ROTATIONS: Record<PipeType, PipeType[]> = {
  '│': ['│', '─'], '─': ['─', '│'],
  '┐': ['┐', '┌', '└', '┘'], '┌': ['┌', '└', '┘', '┐'],
  '┘': ['┘', '┐', '┌', '└'], '└': ['└', '┘', '┐', '┌'],
  '┼': ['┼'], '├': ['├', '┬', '┤', '┴'], '┤': ['┤', '┴', '├', '┬'],
  '┬': ['┬', '┤', '┴', '├'], '┴': ['┴', '├', '┬', '┤'],
};

const GRID_SIZE = 5;
const PIPE_DISPLAY: Record<string, { rotation: number; path: string }> = {
  '│': { rotation: 0, path: 'M 25 0 L 25 50' },
  '─': { rotation: 0, path: 'M 0 25 L 50 25' },
  '┐': { rotation: 0, path: 'M 0 25 L 25 25 L 25 50' },
  '┌': { rotation: 0, path: 'M 50 25 L 25 25 L 25 50' },
  '┘': { rotation: 0, path: 'M 0 25 L 25 25 L 25 0' },
  '└': { rotation: 0, path: 'M 50 25 L 25 25 L 25 0' },
  '┼': { rotation: 0, path: 'M 0 25 L 50 25 M 25 0 L 25 50' },
  '├': { rotation: 0, path: 'M 25 0 L 25 50 M 25 25 L 50 25' },
  '┤': { rotation: 0, path: 'M 25 0 L 25 50 M 25 25 L 0 25' },
  '┬': { rotation: 0, path: 'M 0 25 L 50 25 M 25 25 L 25 50' },
  '┴': { rotation: 0, path: 'M 0 25 L 50 25 M 25 25 L 25 0' },
};

const generatePuzzle = () => {
  const types: PipeType[] = ['│', '─', '┐', '┌', '┘', '└', '┼', '├', '┤', '┬', '┴'];
  const grid: PipeType[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: PipeType[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = types[Math.floor(Math.random() * types.length)];
      const rots = PIPE_ROTATIONS[t];
      row.push(rots[Math.floor(Math.random() * rots.length)]);
    }
    grid.push(row);
  }
  return grid;
};

const PipeConnect: React.FC = () => {
  const [grid, setGrid] = useState(generatePuzzle);
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState(1);

  const rotatePipe = (r: number, c: number) => {
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const current = newGrid[r][c];
      const rotations = PIPE_ROTATIONS[current];
      const idx = rotations.indexOf(current);
      newGrid[r][c] = rotations[(idx + 1) % rotations.length];
      return newGrid;
    });
    setMoves(m => m + 1);
  };

  const nextLevel = () => {
    setGrid(generatePuzzle());
    setMoves(0);
    setLevel(l => l + 1);
  };

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-md mx-auto">
      <div className="flex justify-between w-full mb-4">
        <span className="text-lg font-bold text-primary">Level {level}</span>
        <span className="text-sm text-muted-foreground">Moves: {moves}</span>
      </div>
      <div className="grid gap-1 p-3 bg-muted/30 rounded-xl" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((pipe, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => rotatePipe(r, c)}
              className="w-12 h-12 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            >
              <svg viewBox="0 0 50 50" className="w-8 h-8">
                <path d={PIPE_DISPLAY[pipe]?.path || ''} stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          ))
        )}
      </div>
      <button onClick={nextLevel} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold">
        Next Puzzle
      </button>
    </div>
  );
};

export default PipeConnect;

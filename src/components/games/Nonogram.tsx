import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { RotateCcw, Trophy } from 'lucide-react';

const SIZE = 5;

const generatePuzzle = (): boolean[][] => {
  const g: boolean[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < SIZE; c++) row.push(Math.random() > 0.45);
    g.push(row);
  }
  return g;
};

const getClues = (line: boolean[]): number[] => {
  const clues: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v) count++;
    else if (count > 0) { clues.push(count); count = 0; }
  }
  if (count > 0) clues.push(count);
  return clues.length ? clues : [0];
};

const Nonogram: React.FC = () => {
  const { updateGameStats } = useGame();
  const [solution, setSolution] = useState<boolean[][]>(generatePuzzle);
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: SIZE }, () => Array(SIZE).fill(0))); // 0 empty, 1 filled, 2 marked
  const [won, setWon] = useState(false);

  const rowClues = useMemo(() => solution.map(r => getClues(r)), [solution]);
  const colClues = useMemo(() => {
    const cls: number[][] = [];
    for (let c = 0; c < SIZE; c++) {
      const col = solution.map(r => r[c]);
      cls.push(getClues(col));
    }
    return cls;
  }, [solution]);

  const cycle = (r: number, c: number) => {
    if (won) return;
    const next = grid.map(row => [...row]);
    next[r][c] = (next[r][c] + 1) % 3;
    setGrid(next);
    // check win
    let solved = true;
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE; j++) {
      const filled = next[i][j] === 1;
      if (filled !== solution[i][j]) solved = false;
    }
    if (solved) {
      setWon(true);
      updateGameStats('nonogram', 1000, 30);
    }
  };

  const reset = () => {
    setSolution(generatePuzzle());
    setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Click: fill → mark → clear</span>
        <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
      </div>
      <div className="inline-block">
        <div className="grid" style={{ gridTemplateColumns: `auto repeat(${SIZE}, minmax(0, 1fr))` }}>
          <div />
          {colClues.map((cl, i) => (
            <div key={i} className="text-xs text-center text-muted-foreground p-1 min-w-[2rem]">
              {cl.map((n, k) => <div key={k}>{n}</div>)}
            </div>
          ))}
          {rowClues.map((cl, r) => (
            <React.Fragment key={r}>
              <div className="text-xs text-right text-muted-foreground p-1 flex items-center justify-end gap-1">
                {cl.map((n, k) => <span key={k}>{n}</span>)}
              </div>
              {grid[r].map((v, c) => (
                <button
                  key={c}
                  onClick={() => cycle(r, c)}
                  className={`w-9 h-9 border border-border flex items-center justify-center text-lg ${
                    v === 1 ? 'bg-primary text-primary-foreground' : v === 2 ? 'bg-muted' : 'bg-card'
                  }`}
                >{v === 2 ? '✕' : ''}</button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      {won && (
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-success/10 border border-success/40">
          <Trophy className="w-8 h-8 text-success" />
          <p className="font-bold">Solved!</p>
          <Button variant="gaming" onClick={reset}>New Puzzle</Button>
        </div>
      )}
    </div>
  );
};

export default Nonogram;

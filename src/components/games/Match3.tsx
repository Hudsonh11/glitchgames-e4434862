import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { RotateCcw } from 'lucide-react';

const SIZE = 8;
const COLORS = ['🍎', '🍇', '🍊', '🍋', '🍓', '🍑'];

const newBoard = (): string[][] => {
  const b: string[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: string[] = [];
    for (let c = 0; c < SIZE; c++) row.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    b.push(row);
  }
  return b;
};

const findMatches = (b: string[][]): boolean[][] => {
  const m = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      if (b[r][c] && b[r][c] === b[r][c + 1] && b[r][c] === b[r][c + 2]) {
        m[r][c] = m[r][c + 1] = m[r][c + 2] = true;
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      if (b[r][c] && b[r][c] === b[r + 1][c] && b[r][c] === b[r + 2][c]) {
        m[r][c] = m[r + 1][c] = m[r + 2][c] = true;
      }
    }
  }
  return m;
};

const Match3: React.FC = () => {
  const { updateGameStats } = useGame();
  const [board, setBoard] = useState<string[][]>(newBoard);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [over, setOver] = useState(false);

  const collapse = useCallback((b: string[][]) => {
    let changed = true;
    let total = 0;
    while (changed) {
      changed = false;
      const m = findMatches(b);
      let cleared = 0;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (m[r][c]) { b[r][c] = ''; cleared++; }
      if (cleared > 0) { changed = true; total += cleared; }
      for (let c = 0; c < SIZE; c++) {
        const col = [];
        for (let r = 0; r < SIZE; r++) if (b[r][c]) col.push(b[r][c]);
        while (col.length < SIZE) col.unshift(COLORS[Math.floor(Math.random() * COLORS.length)]);
        for (let r = 0; r < SIZE; r++) b[r][c] = col[r];
      }
    }
    return total;
  }, []);

  useEffect(() => {
    const b = board.map(r => [...r]);
    const cleared = collapse(b);
    if (cleared > 0) { setBoard(b); setScore(s => s + cleared * 10); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (moves <= 0 && !over) {
      setOver(true);
      updateGameStats('match-3', score, 60);
    }
  }, [moves, over, score, updateGameStats]);

  const swap = (r1: number, c1: number, r2: number, c2: number) => {
    const b = board.map(r => [...r]);
    [b[r1][c1], b[r2][c2]] = [b[r2][c2], b[r1][c1]];
    const m = findMatches(b);
    let any = false;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (m[r][c]) any = true;
    if (any) {
      const cleared = collapse(b);
      setBoard(b);
      setScore(s => s + cleared * 10);
      setMoves(mv => mv - 1);
    }
  };

  const handleCell = (r: number, c: number) => {
    if (over) return;
    if (!selected) { setSelected({ r, c }); return; }
    const adj = (Math.abs(selected.r - r) === 1 && selected.c === c) || (Math.abs(selected.c - c) === 1 && selected.r === r);
    if (adj) swap(selected.r, selected.c, r, c);
    setSelected(null);
  };

  const reset = () => { setBoard(newBoard()); setScore(0); setMoves(20); setSelected(null); setOver(false); };

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <div className="flex items-center gap-6">
        <div className="text-sm">Score <span className="font-bold text-primary">{score}</span></div>
        <div className="text-sm">Moves <span className="font-bold">{moves}</span></div>
        <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
        {board.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => handleCell(r, c)}
            className={`w-9 h-9 sm:w-10 sm:h-10 text-2xl rounded-lg flex items-center justify-center transition-all ${
              selected?.r === r && selected?.c === c ? 'bg-primary/30 scale-110' : 'bg-muted hover:bg-muted/70'
            }`}
          >{cell}</button>
        )))}
      </div>
      {over && (
        <div className="text-center p-4 rounded-xl bg-card border border-border">
          <p className="font-bold text-lg">Final Score: {score}</p>
          <Button variant="gaming" onClick={reset} className="mt-2">Play Again</Button>
        </div>
      )}
    </div>
  );
};

export default Match3;

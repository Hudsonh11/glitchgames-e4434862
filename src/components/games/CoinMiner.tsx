import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { sfx } from '@/lib/sfx';

const GRID = 6;

type Cell = 'hidden' | 'coin' | 'gem' | 'bomb' | 'empty';

const build = (): Cell[] => {
  const total = GRID * GRID;
  const arr: Cell[] = Array(total).fill('empty');
  const set = (kind: Cell, count: number) => {
    let placed = 0;
    while (placed < count) {
      const i = Math.floor(Math.random() * total);
      if (arr[i] === 'empty') { arr[i] = kind; placed++; }
    }
  };
  set('bomb', 5); set('gem', 3); set('coin', 12);
  return arr;
};

const CoinMiner: React.FC = () => {
  const [board, setBoard] = useState<Cell[]>(build);
  const [revealed, setRevealed] = useState<boolean[]>(() => Array(GRID * GRID).fill(false));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const { updateGameStats, addCoins } = useGame();
  const stored = useRef(false);

  const reveal = (i: number) => {
    if (revealed[i] || gameOver) return;
    const r = [...revealed]; r[i] = true; setRevealed(r);
    const cell = board[i];
    if (cell === 'bomb') { sfx.crash(); setGameOver(true); }
    else if (cell === 'coin') { setScore((s) => s + 10); sfx.coin(); }
    else if (cell === 'gem') { setScore((s) => s + 50); sfx.success(); }
    else sfx.tick();
  };

  useEffect(() => {
    if (gameOver && !stored.current) {
      stored.current = true;
      updateGameStats('coin-miner', score);
      addCoins(Math.floor(score / 5));
    }
  }, [gameOver, score, updateGameStats, addCoins]);

  const reset = () => { setBoard(build()); setRevealed(Array(GRID * GRID).fill(false)); setScore(0); setGameOver(false); stored.current = false; };

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
        <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => reveal(i)}
            className={`aspect-square rounded-md text-xl flex items-center justify-center transition-all ${
              revealed[i] ? 'bg-muted' : 'bg-gradient-to-br from-primary/20 to-secondary/20 hover:brightness-125 border border-primary/30'
            }`}
          >
            {revealed[i] ? (c === 'coin' ? '🪙' : c === 'gem' ? '💎' : c === 'bomb' ? '💣' : '') : ''}
          </button>
        ))}
      </div>
      {gameOver && <p className="text-center mt-3 text-destructive font-bold">Boom! Final: {score}</p>}
    </div>
  );
};

export default CoinMiner;

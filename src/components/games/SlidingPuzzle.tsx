import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { sfx } from '@/lib/sfx';

const SIZE = 4;

const shuffle = (): number[] => {
  const arr = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const SlidingPuzzle: React.FC = () => {
  const [board, setBoard] = useState<number[]>(shuffle);
  const [moves, setMoves] = useState(0);
  const { updateGameStats, addCoins } = useGame();

  const solved = useMemo(() => board.every((v, i) => v === (i + 1) % (SIZE * SIZE)), [board]);

  const move = (idx: number) => {
    const empty = board.indexOf(0);
    const dr = Math.abs(Math.floor(idx / SIZE) - Math.floor(empty / SIZE));
    const dc = Math.abs((idx % SIZE) - (empty % SIZE));
    if (dr + dc !== 1) return;
    const b = [...board];
    [b[idx], b[empty]] = [b[empty], b[idx]];
    setBoard(b);
    setMoves((m) => m + 1);
    sfx.tick();
    if (b.every((v, i) => v === (i + 1) % (SIZE * SIZE))) {
      const score = Math.max(500 - moves * 5, 50);
      updateGameStats('sliding-puzzle', score);
      addCoins(score / 10);
      sfx.win();
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Moves: {moves}</span>
        {solved && <span className="text-success font-bold">Solved!</span>}
      </div>
      <div className="grid grid-cols-4 gap-2 aspect-square">
        {board.map((v, i) => (
          <button
            key={i}
            onClick={() => move(i)}
            disabled={v === 0}
            className={`rounded-lg font-display text-2xl font-bold transition-all ${
              v === 0 ? 'bg-transparent' : 'bg-gradient-to-br from-primary/30 to-secondary/30 border border-border hover:scale-105'
            }`}
          >
            {v || ''}
          </button>
        ))}
      </div>
      <Button className="mt-4 w-full" variant="outline" onClick={() => { setBoard(shuffle()); setMoves(0); }}>
        Shuffle
      </Button>
    </div>
  );
};

export default SlidingPuzzle;

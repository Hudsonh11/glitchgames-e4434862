import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { RotateCcw, Trophy } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
const TUBE_CAPACITY = 4;

type Tube = string[];

const generateLevel = (numColors: number): Tube[] => {
  const balls: string[] = [];
  for (let i = 0; i < numColors; i++) {
    for (let j = 0; j < TUBE_CAPACITY; j++) balls.push(COLORS[i]);
  }
  // shuffle
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  const tubes: Tube[] = [];
  for (let i = 0; i < numColors; i++) {
    tubes.push(balls.slice(i * TUBE_CAPACITY, (i + 1) * TUBE_CAPACITY));
  }
  tubes.push([], []); // 2 empty tubes
  return tubes;
};

const isSolved = (tubes: Tube[]) =>
  tubes.every(t => t.length === 0 || (t.length === TUBE_CAPACITY && t.every(b => b === t[0])));

const BallSort: React.FC = () => {
  const { updateGameStats } = useGame();
  const [level, setLevel] = useState(1);
  const [tubes, setTubes] = useState<Tube[]>(() => generateLevel(3));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const numColors = Math.min(3 + Math.floor((level - 1) / 2), 6);

  useEffect(() => {
    if (!won && isSolved(tubes)) {
      setWon(true);
      const score = Math.max(100, 1000 - moves * 10) * level;
      updateGameStats('ball-sort', score, 60);
    }
  }, [tubes, won, moves, level, updateGameStats]);

  const handleTubeClick = (i: number) => {
    if (won) return;
    if (selected === null) {
      if (tubes[i].length > 0) setSelected(i);
      return;
    }
    if (selected === i) { setSelected(null); return; }
    const from = [...tubes[selected]];
    const to = [...tubes[i]];
    const ball = from[from.length - 1];
    if (to.length < TUBE_CAPACITY && (to.length === 0 || to[to.length - 1] === ball)) {
      from.pop();
      to.push(ball);
      const next = [...tubes];
      next[selected] = from;
      next[i] = to;
      setTubes(next);
      setMoves(m => m + 1);
    }
    setSelected(null);
  };

  const reset = () => {
    setTubes(generateLevel(numColors));
    setMoves(0);
    setSelected(null);
    setWon(false);
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setTubes(generateLevel(Math.min(3 + Math.floor(level / 2), 6)));
    setMoves(0);
    setSelected(null);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4">
      <div className="flex items-center gap-4 w-full justify-between">
        <div className="text-sm">Level <span className="font-bold text-primary">{level}</span></div>
        <div className="text-sm">Moves <span className="font-bold">{moves}</span></div>
        <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {tubes.map((tube, i) => (
          <button
            key={i}
            onClick={() => handleTubeClick(i)}
            className={`relative w-12 h-44 rounded-b-2xl border-2 border-t-0 flex flex-col-reverse p-1 gap-1 transition-all ${
              selected === i ? 'border-primary -translate-y-2 shadow-neon-cyan' : 'border-border'
            } bg-card`}
            aria-label={`Tube ${i + 1}`}
          >
            {tube.map((color, j) => (
              <div
                key={j}
                className="w-full aspect-square rounded-full shadow-inner"
                style={{ background: color }}
              />
            ))}
          </button>
        ))}
      </div>

      {won && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/40">
          <Trophy className="w-8 h-8 text-success" />
          <p className="font-bold">Level cleared in {moves} moves!</p>
          <Button variant="gaming" onClick={nextLevel}>Next Level →</Button>
        </div>
      )}
    </div>
  );
};

export default BallSort;

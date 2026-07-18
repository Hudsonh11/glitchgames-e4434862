import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { sfx } from '@/lib/sfx';

type Tile = { id: number; col: number; y: number };
const COLS = 4;

const PianoTiles: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const nextId = useRef(0);
  const { updateGameStats, addCoins } = useGame();

  useEffect(() => {
    if (!playing) return;
    const speed = 3 + Math.min(6, score / 10);
    const spawn = setInterval(() => {
      setTiles((t) => [...t, { id: nextId.current++, col: Math.floor(Math.random() * COLS), y: -80 }]);
    }, 700);
    const tick = setInterval(() => {
      setTiles((t) => {
        const moved = t.map((x) => ({ ...x, y: x.y + speed }));
        if (moved.some((x) => x.y > 420)) {
          setPlaying(false); setGameOver(true); sfx.lose();
          return moved;
        }
        return moved.filter((x) => x.y < 500);
      });
    }, 30);
    return () => { clearInterval(spawn); clearInterval(tick); };
  }, [playing, score]);

  const tap = (id: number) => {
    setTiles((t) => t.filter((x) => x.id !== id));
    setScore((s) => s + 1);
    sfx.tick();
  };

  const start = () => {
    setTiles([]); setScore(0); setGameOver(false); setPlaying(true);
  };

  useEffect(() => {
    if (gameOver) {
      updateGameStats('piano-tiles', score);
      addCoins(Math.floor(score / 3));
    }
  }, [gameOver, score, updateGameStats, addCoins]);

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
        {gameOver && <span className="text-destructive font-bold">Game Over</span>}
      </div>
      <div className="relative h-[420px] w-full rounded-xl bg-muted/40 border border-border overflow-hidden grid grid-cols-4">
        {Array.from({ length: COLS }).map((_, i) => (
          <div key={i} className="border-r border-border/50 last:border-r-0" />
        ))}
        {tiles.map((t) => (
          <button
            key={t.id}
            onClick={() => tap(t.id)}
            className="absolute w-1/4 h-20 bg-foreground/90 hover:bg-primary transition-colors"
            style={{ left: `${(t.col * 100) / COLS}%`, top: t.y }}
          />
        ))}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Button variant="gaming" onClick={start}>{gameOver ? 'Play Again' : 'Start'}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PianoTiles;

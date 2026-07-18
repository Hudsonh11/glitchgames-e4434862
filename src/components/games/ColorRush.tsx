import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const COLORS = [
  { name: 'Red', hsl: 'hsl(0 90% 55%)' },
  { name: 'Blue', hsl: 'hsl(220 90% 55%)' },
  { name: 'Green', hsl: 'hsl(140 70% 45%)' },
  { name: 'Yellow', hsl: 'hsl(50 95% 55%)' },
  { name: 'Purple', hsl: 'hsl(280 80% 60%)' },
];

const ColorRush: React.FC = () => {
  const [target, setTarget] = useState(0);
  const [display, setDisplay] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [playing, setPlaying] = useState(false);
  const { updateGameStats, addCoins } = useGame();

  const next = () => {
    setTarget(Math.floor(Math.random() * COLORS.length));
    setDisplay(Math.floor(Math.random() * COLORS.length));
  };

  useEffect(() => {
    if (!playing) return;
    if (time <= 0) {
      setPlaying(false); updateGameStats('color-rush', score, 0); addCoins(Math.floor(score / 2)); playSfx('win');
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, time, score, updateGameStats, addCoins]);

  const start = () => { setScore(0); setTime(30); setPlaying(true); next(); };

  const pick = (i: number) => {
    if (i === target) { setScore((s) => s + 1); playSfx('pop'); } else { setScore((s) => Math.max(0, s - 1)); playSfx('error'); }
    next();
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
        <span className="font-bold text-warning">⏱ {time}s</span>
      </div>
      {playing ? (
        <>
          <p className="text-center text-sm text-muted-foreground mb-2">Tap the color that matches this <em>word</em>:</p>
          <div className="text-center text-5xl font-display font-bold mb-6" style={{ color: COLORS[display].hsl }}>
            {COLORS[target].name}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c, i) => (
              <button key={i} onClick={() => pick(i)} className="h-16 rounded-lg hover:scale-105 transition-transform" style={{ background: c.hsl }} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Button variant="gaming" onClick={start}>{score ? `Play Again — Best ${score}` : 'Start'}</Button>
        </div>
      )}
    </div>
  );
};

export default ColorRush;

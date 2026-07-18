import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const AimTrainer: React.FC = () => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playing, setPlaying] = useState(false);
  const { updateGameStats, addCoins } = useGame();

  const spawn = () => {
    const el = areaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTarget({ x: Math.random() * (r.width - 50), y: Math.random() * (r.height - 50) });
  };

  useEffect(() => {
    if (!playing) return;
    if (timeLeft <= 0) {
      setPlaying(false);
      updateGameStats('aim-trainer', score, 0);
      addCoins(Math.floor(score / 2));
      playSfx('win');
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, timeLeft, score, updateGameStats, addCoins]);

  const start = () => {
    setScore(0); setTimeLeft(30); setPlaying(true);
    setTimeout(spawn, 50);
  };

  const hit = () => { setScore((s) => s + 1); playSfx('pop'); spawn(); };

  return (
    <div className="w-full max-w-xl">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
        <span className="font-bold text-warning">⏱ {timeLeft}s</span>
      </div>
      <div ref={areaRef} className="relative w-full h-96 rounded-xl bg-muted/40 border border-border overflow-hidden">
        {playing && target && (
          <button
            onClick={hit}
            className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary shadow-neon-cyan animate-pop-in"
            style={{ left: target.x, top: target.y }}
            aria-label="target"
          />
        )}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button variant="gaming" onClick={start}>{timeLeft === 30 ? 'Start' : 'Play Again'}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AimTrainer;

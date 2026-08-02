import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const COLS = 10, ROWS = 12;

const BubbleWrap: React.FC = () => {
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [sheets, setSheets] = useState(0);
  const [hue, setHue] = useState(190);
  const audioRef = useRef(0);
  const { updateGameStats, addCoins } = useGame();

  const cells = useMemo(() => Array.from({ length: COLS * ROWS }, (_, i) => i), []);
  const total = COLS * ROWS;

  const pop = (i: number) => {
    if (popped.has(i)) return;
    const next = new Set(popped);
    next.add(i);
    setPopped(next);
    audioRef.current = (audioRef.current + 1) % 3;
    playSfx(audioRef.current === 0 ? 'pop' : audioRef.current === 1 ? 'tick' : 'click');
    if (next.size === total) {
      playSfx('win');
      addCoins(5);
      updateGameStats('bubble-wrap', (sheets + 1) * 100, 0);
      setTimeout(() => {
        setPopped(new Set());
        setSheets((s) => s + 1);
        setHue((h) => (h + 47) % 360);
      }, 700);
    }
  };

  const reset = () => { setPopped(new Set()); setHue((h) => (h + 47) % 360); playSfx('whoosh'); };

  const pct = Math.round((popped.size / total) * 100);

  return (
    <div className="w-full max-w-md mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">{pct}% popped</span>
        <span className="text-accent">Sheets {sheets}</span>
      </div>

      <div
        className="rounded-2xl p-3 border border-border select-none"
        style={{ background: `linear-gradient(140deg, hsl(${hue} 60% 18%), hsl(${(hue + 60) % 360} 60% 10%))` }}
      >
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0,1fr))` }}>
          {cells.map((i) => {
            const done = popped.has(i);
            return (
              <button
                key={i}
                onPointerEnter={(e) => { if (e.buttons === 1) pop(i); }}
                onPointerDown={() => pop(i)}
                aria-label={done ? 'Popped bubble' : 'Bubble'}
                className={`aspect-square rounded-full transition-all duration-200 ${done ? 'scale-90 opacity-40' : 'hover:scale-110 active:scale-95'}`}
                style={{
                  background: done
                    ? `radial-gradient(circle at 50% 55%, hsl(${hue} 30% 22%), hsl(${hue} 30% 14%))`
                    : `radial-gradient(circle at 32% 28%, hsl(${hue} 90% 88%), hsl(${hue} 75% 62%) 45%, hsl(${hue} 70% 42%))`,
                  boxShadow: done ? 'inset 0 2px 6px rgba(0,0,0,0.6)' : `0 3px 8px hsla(${hue}, 80%, 20%, 0.6)`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">Tap or drag across the bubbles. Clear the sheet for a fresh one.</p>
        <Button variant="outline" size="sm" onClick={reset}>New Sheet</Button>
      </div>
    </div>
  );
};

export default BubbleWrap;

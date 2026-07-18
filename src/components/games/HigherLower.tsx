import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const roll = () => Math.floor(Math.random() * 100) + 1;

const HigherLower: React.FC = () => {
  const [current, setCurrent] = useState(roll());
  const [next, setNext] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const { updateGameStats, addCoins } = useGame();

  const guess = (dir: 'higher' | 'lower') => {
    const n = roll();
    const win = dir === 'higher' ? n > current : n < current;
    setNext(n);
    setTimeout(() => {
      if (win) {
        setStreak((s) => s + 1); setCurrent(n); setNext(null); playSfx('pop');
      } else {
        setGameOver(true); playSfx('lose');
        updateGameStats('higher-lower', streak, 0);
        addCoins(streak * 2);
      }
    }, 700);
  };

  const reset = () => { setCurrent(roll()); setNext(null); setStreak(0); setGameOver(false); };

  return (
    <div className="w-full max-w-sm text-center">
      <p className="text-muted-foreground mb-2">Streak: <span className="text-primary font-bold">{streak}</span></p>
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-border flex items-center justify-center font-display text-4xl font-bold">
          {current}
        </div>
        <div className="w-24 h-32 rounded-xl bg-muted border border-border flex items-center justify-center font-display text-4xl font-bold">
          {next ?? '?'}
        </div>
      </div>
      {gameOver ? (
        <>
          <p className="text-destructive font-bold mb-3">Wrong! Final streak: {streak}</p>
          <Button variant="gaming" onClick={reset}>Play Again</Button>
        </>
      ) : (
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => guess('lower')} disabled={next !== null}>Lower</Button>
          <Button variant="gaming" onClick={() => guess('higher')} disabled={next !== null}>Higher</Button>
        </div>
      )}
    </div>
  );
};

export default HigherLower;

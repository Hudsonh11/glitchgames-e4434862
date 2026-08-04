import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

type Phase = 'idle' | 'reveal' | 'shuffle' | 'guess' | 'result';

const CupShuffle: React.FC = () => {
  const [cups, setCups] = useState(3);
  const [ballIndex, setBallIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const timers = useRef<number[]>([]);
  const { updateGameStats, addCoins } = useGame();

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const start = useCallback((roundNum: number, currentStreak: number) => {
    clearTimers();
    const cupCount = Math.min(3 + Math.floor((roundNum - 1) / 3), 6);
    const start = Array.from({ length: cupCount }, (_, i) => i);
    const ball = Math.floor(Math.random() * cupCount);
    setCups(cupCount);
    setOrder(start);
    setBallIndex(ball);
    setPicked(null);
    setPhase('reveal');
    playSfx('notification');

    const swaps = 5 + roundNum * 2;
    const speed = Math.max(190, 620 - roundNum * 35);
    let working = [...start];
    let ballPos = ball;

    timers.current.push(window.setTimeout(() => {
      setPhase('shuffle');
      for (let s = 0; s < swaps; s++) {
        timers.current.push(window.setTimeout(() => {
          const a = Math.floor(Math.random() * cupCount);
          let b = Math.floor(Math.random() * cupCount);
          while (b === a) b = Math.floor(Math.random() * cupCount);
          const next = [...working];
          [next[a], next[b]] = [next[b], next[a]];
          working = next;
          if (ballPos === a) ballPos = b;
          else if (ballPos === b) ballPos = a;
          setOrder(next);
          setBallIndex(ballPos);
          playSfx('tick');
          if (s === swaps - 1) {
            timers.current.push(window.setTimeout(() => setPhase('guess'), speed));
          }
        }, s * speed));
      }
    }, 1400));
    void currentStreak;
  }, []);

  const pick = (slot: number) => {
    if (phase !== 'guess') return;
    setPicked(slot);
    const success = slot === ballIndex;
    setWon(success);
    setPhase('result');
    playSfx(success ? 'success' : 'error');
    if (success) {
      const s = streak + 1;
      setStreak(s);
      setBest((prevBest) => Math.max(prevBest, s));
      addCoins(5 + round * 2);
      updateGameStats('cup-shuffle', s, 0);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    const r = won ? round + 1 : 1;
    setRound(r);
    start(r, streak);
  };

  const revealed = phase === 'reveal' || phase === 'result';

  return (
    <div className="w-full max-w-lg mx-auto text-center animate-fade-in">
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="text-muted-foreground">Round <span className="text-primary font-bold">{round}</span></span>
        <span className="text-muted-foreground">Streak <span className="text-primary font-bold">{streak}</span></span>
        <span className="text-muted-foreground">Best <span className="text-warning font-bold">{best}</span></span>
      </div>

      <div className="relative h-48 rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border flex items-end justify-center gap-3 p-4 overflow-hidden">
        {order.map((cupId, slot) => {
          const hasBall = slot === ballIndex;
          const lifted = revealed && hasBall;
          const isPick = picked === slot;
          return (
            <button
              key={cupId}
              onClick={() => pick(slot)}
              disabled={phase !== 'guess'}
              className="relative flex-1 max-w-[70px] h-full flex flex-col justify-end items-center group"
            >
              {hasBall && (
                <span className="absolute bottom-2 w-6 h-6 rounded-full bg-warning shadow-[0_0_16px_hsl(var(--warning))]" />
              )}
              <span
                className={`w-full rounded-t-[40%] rounded-b-md border-2 transition-all duration-300 ${
                  isPick && phase === 'result'
                    ? won ? 'border-success bg-success/40' : 'border-destructive bg-destructive/40'
                    : 'border-primary/50 bg-primary/25 group-hover:bg-primary/40'
                }`}
                style={{
                  height: lifted ? '55%' : '80%',
                  transform: lifted ? 'translateY(-42px) rotate(-8deg)' : 'none',
                }}
              />
            </button>
          );
        })}
        {phase === 'idle' && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <Button variant="gaming" size="lg" onClick={() => start(1, 0)}>Start Shuffling</Button>
          </div>
        )}
      </div>

      <p className="mt-4 h-6 text-sm font-medium">
        {phase === 'reveal' && <span className="text-warning">Watch the ball…</span>}
        {phase === 'shuffle' && <span className="text-primary">Shuffling!</span>}
        {phase === 'guess' && <span className="text-foreground">Where is the ball? Tap a cup.</span>}
        {phase === 'result' && (won
          ? <span className="text-success">Correct! +{5 + round * 2} coins</span>
          : <span className="text-destructive">Missed it — streak reset</span>)}
      </p>

      {(phase === 'result') && (
        <Button variant="gaming" className="mt-3" onClick={next}>{won ? 'Next Round' : 'Try Again'}</Button>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{cups} cups • speed and cup count rise every few rounds.</p>
    </div>
  );
};

export default CupShuffle;

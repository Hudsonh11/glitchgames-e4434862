import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';
import { Scissors, Bomb, Timer } from 'lucide-react';

interface Wire {
  color: string;
  label: string;
  cut: boolean;
}

const PALETTE = [
  { color: 'hsl(0, 85%, 55%)', label: 'Red' },
  { color: 'hsl(210, 90%, 55%)', label: 'Blue' },
  { color: 'hsl(140, 70%, 45%)', label: 'Green' },
  { color: 'hsl(45, 100%, 55%)', label: 'Yellow' },
  { color: 'hsl(280, 80%, 60%)', label: 'Purple' },
  { color: 'hsl(0, 0%, 75%)', label: 'White' },
];

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildRound = (level: number) => {
  const count = Math.min(3 + Math.floor(level / 2), 6);
  const wires: Wire[] = shuffle(PALETTE).slice(0, count).map((w) => ({ ...w, cut: false }));
  const safe = Math.floor(Math.random() * wires.length);

  // Build a deterministic clue set that always points at exactly one wire.
  const clues: string[] = [];
  clues.push(`The safe wire is NOT ${wires.filter((_, i) => i !== safe).slice(0, 1)[0]?.label ?? 'unknown'}... wait — that one is a decoy.`);
  clues[0] = `Serial ends in ${safe % 2 === 0 ? 'an even digit' : 'an odd digit'} — cut a wire in an ${safe % 2 === 0 ? 'even' : 'odd'} position (counting from 1: ${safe % 2 === 0 ? 'odd' : 'even'} index).`;
  clues[0] = `Position parity: the safe wire sits at position ${safe + 1 <= wires.length ? (safe + 1) % 2 === 1 ? 'an ODD number' : 'an EVEN number' : ''} from the top.`;
  clues.push(`The safe wire is ${wires[safe].label}.`.replace(wires[safe].label, '???'));
  const others = wires.map((w, i) => i).filter((i) => i !== safe);
  const eliminated = shuffle(others).slice(0, Math.max(1, wires.length - 2));
  clues.push(`Defusal manual: never cut ${eliminated.map((i) => wires[i].label).join(', ')}.`);
  const remaining = wires.map((_, i) => i).filter((i) => !eliminated.includes(i));
  if (remaining.length > 1) {
    const other = remaining.find((i) => i !== safe)!;
    clues.push(
      Math.random() > 0.5
        ? `The safe wire is ${safe < other ? 'ABOVE' : 'BELOW'} the ${wires[other].label} wire.`
        : `The ${wires[other].label} wire is a trap.`,
    );
  }
  return { wires, safe, clues };
};

const BombDefuse: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(() => buildRound(1));
  const [time, setTime] = useState(20);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);
  const { updateGameStats, addCoins } = useGame();

  const endGame = useCallback((finalScore: number) => {
    setStatus('lost');
    playSfx('crash');
    updateGameStats('bomb-defuse', finalScore, 0);
    addCoins(Math.floor(finalScore / 2));
  }, [updateGameStats, addCoins]);

  useEffect(() => {
    if (status !== 'playing') return;
    const t = setInterval(() => {
      setTime((s) => {
        if (s <= 1) {
          clearInterval(t);
          endGame(score);
          return 0;
        }
        if (s <= 6) playSfx('tick');
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status, score, endGame]);

  const cut = (index: number) => {
    if (status !== 'playing') return;
    if (index === round.safe) {
      playSfx('success');
      const gained = 10 + level * 5 + time;
      const total = score + gained;
      setScore(total);
      setStatus('won');
      addCoins(10 + level * 3);
    } else {
      playSfx('error');
      endGame(score);
      setRound((r) => ({ ...r, wires: r.wires.map((w, i) => (i === index ? { ...w, cut: true } : w)) }));
    }
  };

  const nextLevel = () => {
    const l = level + 1;
    setLevel(l);
    setRound(buildRound(l));
    setTime(Math.max(10, 22 - l));
    setStatus('playing');
  };

  const restart = () => {
    setLevel(1);
    setRound(buildRound(1));
    setTime(20);
    setScore(0);
    setStatus('playing');
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground"><Bomb className="w-4 h-4" /> Level {level}</span>
        <span className={`flex items-center gap-1.5 font-bold ${time <= 6 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
          <Timer className="w-4 h-4" /> {time}s
        </span>
        <span className="text-muted-foreground">Score <span className="text-warning font-bold">{score}</span></span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        {round.wires.map((w, i) => (
          <button
            key={w.label}
            onClick={() => cut(i)}
            disabled={status !== 'playing'}
            className="w-full flex items-center gap-3 group disabled:opacity-70"
          >
            <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
            <span
              className="flex-1 h-3 rounded-full transition-all group-hover:h-4"
              style={{
                background: w.cut ? 'hsl(var(--muted))' : w.color,
                boxShadow: w.cut ? 'none' : `0 0 12px ${w.color}`,
              }}
            />
            <Scissors className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 border border-border p-3 text-left space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-wide">Defusal Manual</p>
        {round.clues.filter((c) => !c.includes('???')).map((c) => (
          <p key={c} className="text-xs text-muted-foreground">• {c}</p>
        ))}
      </div>

      {status === 'won' && (
        <div className="mt-4 text-center">
          <p className="text-success font-bold mb-2">Defused! Score {score}</p>
          <Button variant="gaming" onClick={nextLevel}>Next Bomb</Button>
        </div>
      )}
      {status === 'lost' && (
        <div className="mt-4 text-center">
          <p className="text-destructive font-bold mb-2">
            BOOM! The safe wire was {round.wires[round.safe].label}. Final score {score}
          </p>
          <Button variant="gaming" onClick={restart}>Try Again</Button>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground text-center">Read the manual, cut the one safe wire before the timer runs out.</p>
    </div>
  );
};

export default BombDefuse;

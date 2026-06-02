import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Users, Trophy, RotateCcw, Send } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

// Character roster with attributes used for yes/no questions.
type Char = {
  name: string;
  emoji: string;
  hat: boolean;
  glasses: boolean;
  beard: boolean;
  hairColor: 'blonde' | 'brown' | 'black' | 'red' | 'none';
  female: boolean;
};

const ROSTER: Char[] = [
  { name: 'Alice',   emoji: '👩‍🦰', hat:false, glasses:false, beard:false, hairColor:'red',    female:true  },
  { name: 'Bob',     emoji: '👨',   hat:false, glasses:false, beard:false, hairColor:'brown',  female:false },
  { name: 'Clara',   emoji: '👩‍🦱', hat:false, glasses:true,  beard:false, hairColor:'black',  female:true  },
  { name: 'Derek',   emoji: '👨‍🦲', hat:false, glasses:false, beard:true,  hairColor:'none',   female:false },
  { name: 'Eva',     emoji: '👱‍♀️', hat:false, glasses:false, beard:false, hairColor:'blonde', female:true  },
  { name: 'Frank',   emoji: '🧔',   hat:false, glasses:true,  beard:true,  hairColor:'brown',  female:false },
  { name: 'Gina',    emoji: '👵',   hat:false, glasses:true,  beard:false, hairColor:'none',   female:true  },
  { name: 'Henry',   emoji: '🤠',   hat:true,  glasses:false, beard:true,  hairColor:'brown',  female:false },
  { name: 'Ivy',     emoji: '👩‍🎤', hat:false, glasses:false, beard:false, hairColor:'black',  female:true  },
  { name: 'Jack',    emoji: '🧑‍🚀', hat:true,  glasses:false, beard:false, hairColor:'black',  female:false },
  { name: 'Kate',    emoji: '👮‍♀️', hat:true,  glasses:false, beard:false, hairColor:'blonde', female:true  },
  { name: 'Leo',     emoji: '👨‍🍳', hat:true,  glasses:false, beard:false, hairColor:'brown',  female:false },
];

const QUESTIONS: { id: string; label: string; test: (c: Char) => boolean }[] = [
  { id: 'female',     label: 'Are they female?',          test: (c) => c.female },
  { id: 'hat',        label: 'Do they wear a hat?',       test: (c) => c.hat },
  { id: 'glasses',    label: 'Do they wear glasses?',     test: (c) => c.glasses },
  { id: 'beard',      label: 'Do they have a beard?',     test: (c) => c.beard },
  { id: 'blonde',     label: 'Is their hair blonde?',     test: (c) => c.hairColor === 'blonde' },
  { id: 'brown',      label: 'Is their hair brown?',      test: (c) => c.hairColor === 'brown' },
  { id: 'black',      label: 'Is their hair black?',      test: (c) => c.hairColor === 'black' },
  { id: 'red',        label: 'Is their hair red?',        test: (c) => c.hairColor === 'red' },
  { id: 'bald',       label: 'Are they bald?',            test: (c) => c.hairColor === 'none' },
];

type Mode = 'menu' | 'bot' | 'friend';
type Turn = 1 | 2;

const GuessThePerson: React.FC = () => {
  const { updateGameStats } = useGame();
  const [mode, setMode] = useState<Mode>('menu');
  const [p1Secret, setP1Secret] = useState<Char | null>(null);
  const [p2Secret, setP2Secret] = useState<Char | null>(null);
  const [eliminated1, setEliminated1] = useState<Set<string>>(new Set());
  const [eliminated2, setEliminated2] = useState<Set<string>>(new Set());
  const [turn, setTurn] = useState<Turn>(1);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<Turn | null>(null);
  const [setupStep, setSetupStep] = useState<'p1' | 'p2' | 'play'>('p1');

  const random = useCallback(() => ROSTER[Math.floor(Math.random() * ROSTER.length)], []);

  const start = (m: Mode) => {
    setMode(m);
    setEliminated1(new Set());
    setEliminated2(new Set());
    setTurn(1);
    setLog([]);
    setWinner(null);
    if (m === 'bot') {
      setP1Secret(null);
      setP2Secret(random());
      setSetupStep('p1');
    } else {
      setP1Secret(null);
      setP2Secret(null);
      setSetupStep('p1');
    }
  };

  const ask = (q: typeof QUESTIONS[number]) => {
    if (winner) return;
    const askerSecret = turn === 1 ? p2Secret! : p1Secret!;
    const answer = q.test(askerSecret);
    const setElim = turn === 1 ? setEliminated1 : setEliminated2;
    setElim((prev) => {
      const next = new Set(prev);
      for (const c of ROSTER) {
        if (q.test(c) !== answer) next.add(c.name);
      }
      return next;
    });
    setLog((l) => [`P${turn}: ${q.label} → ${answer ? 'Yes' : 'No'}`, ...l].slice(0, 8));

    if (mode === 'bot' && turn === 1) {
      // Bot's turn: pick a question that splits its remaining candidates well.
      setTimeout(() => {
        const remaining = ROSTER.filter((c) => !eliminated2.has(c.name));
        const best = QUESTIONS.map((q) => {
          const yes = remaining.filter((c) => q.test(c)).length;
          return { q, score: Math.abs(remaining.length / 2 - yes) };
        }).sort((a, b) => a.score - b.score)[0];
        const ans = best.q.test(p1Secret!);
        setEliminated2((prev) => {
          const next = new Set(prev);
          for (const c of ROSTER) if (best.q.test(c) !== ans) next.add(c.name);
          return next;
        });
        setLog((l) => [`Bot: ${best.q.label} → ${ans ? 'Yes' : 'No'}`, ...l].slice(0, 8));
        // Bot guesses when only 1-2 remain
        const left = ROSTER.filter((c) => !eliminated2.has(c.name) && best.q.test(c) === ans);
        if (left.length <= 1 && left[0]) {
          if (left[0].name === p1Secret!.name) {
            setWinner(2);
            setLog((l) => [`Bot guessed ${left[0].name} — Bot wins!`, ...l]);
          }
        }
        setTurn(1);
      }, 800);
      setTurn(2);
    } else {
      setTurn((t) => (t === 1 ? 2 : 1));
    }
  };

  const guess = (c: Char) => {
    if (winner) return;
    const target = turn === 1 ? p2Secret! : p1Secret!;
    if (c.name === target.name) {
      setWinner(turn);
      updateGameStats('guess-the-person', turn === 1 ? 1000 : 0, 120).catch(() => {});
      setLog((l) => [`P${turn} guessed ${c.name} — Player ${turn} wins!`, ...l]);
    } else {
      setLog((l) => [`P${turn} guessed ${c.name} — Wrong! Skip turn.`, ...l].slice(0, 8));
      setTurn((t) => (t === 1 ? 2 : 1));
    }
  };

  if (mode === 'menu') {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6 py-8">
        <div className="inline-block px-3 py-1 rounded-full bg-warning/20 border border-warning/40 text-warning text-xs font-bold">
          ⚡ PLUS EXCLUSIVE
        </div>
        <h2 className="font-display text-3xl font-bold text-gradient">Guess The Person</h2>
        <p className="text-muted-foreground text-sm">
          Ask yes/no questions to narrow down which character your opponent chose. Guess theirs before they guess yours!
        </p>
        <div className="grid gap-3">
          <Button onClick={() => start('bot')} variant="gaming" size="lg">
            <Bot className="w-4 h-4 mr-2" /> Play vs Bot
          </Button>
          <Button onClick={() => start('friend')} variant="outline" size="lg">
            <Users className="w-4 h-4 mr-2" /> Friend (Split Screen)
          </Button>
        </div>
      </div>
    );
  }

  // Secret-character selection
  if (setupStep !== 'play') {
    const who = setupStep === 'p1' ? 'Player 1' : 'Player 2';
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 text-center">
        <h3 className="font-display text-xl font-bold">{who}: pick your secret character</h3>
        <p className="text-xs text-muted-foreground">Keep it secret from the other player!</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {ROSTER.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                if (setupStep === 'p1') {
                  setP1Secret(c);
                  if (mode === 'bot') setSetupStep('play');
                  else setSetupStep('p2');
                } else {
                  setP2Secret(c);
                  setSetupStep('play');
                }
              }}
              className="flex flex-col items-center p-2 rounded-xl bg-card border border-border hover:border-primary transition"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-xs mt-1">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const eliminated = turn === 1 ? eliminated1 : eliminated2;

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <div className="flex items-center justify-between px-2">
        <div className="text-xs">Your secret: <span className="font-bold">{(turn === 1 ? p1Secret : p2Secret)?.emoji}</span></div>
        <div className="text-sm font-bold text-primary">P{turn}'s turn</div>
        <div className="text-xs text-muted-foreground">{mode === 'bot' ? 'vs Bot' : '2P'}</div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {ROSTER.map((c) => {
          const out = eliminated.has(c.name);
          return (
            <button
              key={c.name}
              onClick={() => !out && guess(c)}
              disabled={out || !!winner}
              className={`flex flex-col items-center p-2 rounded-xl border transition ${
                out ? 'bg-muted/30 border-border/30 opacity-30 line-through' : 'bg-card border-border hover:border-primary'
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-[10px] mt-1">{c.name}</span>
            </button>
          );
        })}
      </div>

      {!winner && (
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-2">Ask a yes/no question:</p>
          <div className="flex flex-wrap gap-1">
            {QUESTIONS.map((q) => (
              <Button key={q.id} onClick={() => ask(q)} variant="outline" size="sm" className="text-xs">
                <Send className="w-3 h-3 mr-1" /> {q.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="p-2 rounded-xl bg-muted/40 text-xs space-y-1 max-h-32 overflow-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {winner && (
        <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/30">
          <p className="font-bold flex items-center justify-center gap-2"><Trophy className="w-4 h-4" /> Player {winner} wins!</p>
          <Button onClick={() => { setMode('menu'); }} variant="gaming" size="sm" className="mt-2">
            <RotateCcw className="w-4 h-4 mr-1" /> New Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default GuessThePerson;

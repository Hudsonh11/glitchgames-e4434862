import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Check } from 'lucide-react';
import { toast } from 'sonner';
import { playSfx } from '@/lib/sfx';

const GOAL = 3;
const REWARD_COINS = 150;

const todayKey = () => new Date().toISOString().split('T')[0];
const storeKey = (uid: string) => `gg:dailygoal:${uid}`;

interface Stored { day: string; plays: number; claimed: boolean; baseline: number }

/**
 * Daily Goal — play 3 games today for a coin bonus.
 * Progress is derived from total games played vs. a baseline captured at the
 * start of the day, so it can't be gamed by refreshing.
 */
const DailyGoal: React.FC = () => {
  const { gameStats, addCoins, isLoggedIn, user } = useGame();
  const uid = user?.id || 'guest';
  const totalPlays = useMemo(
    () => Object.values(gameStats).reduce((a, s) => a + (s.gamesPlayed || 0), 0),
    [gameStats],
  );

  const [state, setState] = useState<Stored>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey(uid)) || 'null');
      if (raw && raw.day === todayKey()) return raw;
    } catch { /* ignore */ }
    return { day: todayKey(), plays: 0, claimed: false, baseline: -1 };
  });

  useEffect(() => {
    setState((prev) => {
      const day = todayKey();
      const base = prev.day !== day || prev.baseline < 0 ? totalPlays : prev.baseline;
      const next: Stored = {
        day,
        baseline: base,
        plays: Math.max(0, totalPlays - base),
        claimed: prev.day === day ? prev.claimed : false,
      };
      localStorage.setItem(storeKey(uid), JSON.stringify(next));
      return next;
    });
  }, [totalPlays, uid]);

  if (!isLoggedIn) return null;

  const done = Math.min(state.plays, GOAL);
  const complete = done >= GOAL;

  const claim = async () => {
    if (!complete || state.claimed) return;
    await addCoins(REWARD_COINS);
    playSfx('coin');
    const next = { ...state, claimed: true };
    setState(next);
    localStorage.setItem(storeKey(uid), JSON.stringify(next));
    toast.success(`Daily goal complete — +${REWARD_COINS} coins!`);
  };

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-success" /> Daily Goal
        </h3>
        <span className="text-xs text-muted-foreground">{done}/{GOAL} games today</span>
      </div>
      <Progress value={(done / GOAL) * 100} className="h-2 mb-4" />
      <Button
        variant={complete && !state.claimed ? 'gaming' : 'outline'}
        size="sm"
        className="w-full"
        disabled={!complete || state.claimed}
        onClick={claim}
      >
        {state.claimed ? (<><Check className="w-4 h-4 mr-1" /> Claimed today</>) :
          complete ? `Claim ${REWARD_COINS} coins` : `Play ${GOAL - done} more game${GOAL - done === 1 ? '' : 's'}`}
      </Button>
    </div>
  );
};

export default DailyGoal;

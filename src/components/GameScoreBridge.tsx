import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import UltraConfetti from '@/components/UltraConfetti';
import { toast } from 'sonner';
import { playSfx } from '@/lib/sfx';


/**
 * Bridges legacy games that report progress through an `onScoreUpdate` prop
 * into the Glitch Games points system (leaderboard stats + coins).
 *
 * - Keeps the best score of the session and persists it (debounced, and on unmount).
 * - Awards coins for score milestones, capped per session so nothing can be farmed.
 */

const COINS_PER_POINTS = 100; // 1 coin per 100 points
const SESSION_COIN_CAP = 250;
const FLUSH_MS = 2500;

interface Props {
  gameId: string;
  component: React.FC<any>;
}

const GameScoreBridge: React.FC<Props> = ({ gameId, component: GameComponent }) => {
  const { updateGameStats, addCoins, gameStats } = useGame();
  const best = useRef(0);
  const persisted = useRef(0);
  const coinsAwarded = useRef(0);
  const startedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const previousBest = useRef<number>(gameStats?.[gameId]?.highScore || 0);
  const celebrated = useRef(false);
  const [celebrate, setCelebrate] = useState(false);

  const flush = useCallback(async () => {
    const score = best.current;
    if (score <= persisted.current) return;
    persisted.current = score;
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    await updateGameStats(gameId, score, seconds);
    const earned = Math.min(
      SESSION_COIN_CAP - coinsAwarded.current,
      Math.floor(score / COINS_PER_POINTS) - coinsAwarded.current,
    );
    if (earned > 0) {
      coinsAwarded.current += earned;
      await addCoins(earned);
    }
  }, [gameId, updateGameStats, addCoins]);

  const handleScore = useCallback((raw: number) => {
    const score = Math.floor(Number(raw));
    if (!Number.isFinite(score) || score <= 0 || score <= best.current) return;
    best.current = score;

    // Personal-best celebration (once per session).
    if (!celebrated.current && previousBest.current > 0 && score > previousBest.current) {
      celebrated.current = true;
      setCelebrate(true);
      playSfx('win');
      toast.success(`New personal best — ${score.toLocaleString()} points!`);
      setTimeout(() => setCelebrate(false), 3500);
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, FLUSH_MS);
  }, [flush]);

  // Persist whatever is pending when the player leaves the game.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

  return (
    <>
      <UltraConfetti active={celebrate} />
      <GameComponent onScoreUpdate={handleScore} />
    </>
  );
};


export default GameScoreBridge;

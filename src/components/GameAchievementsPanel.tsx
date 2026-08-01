import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Check } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { achievementsForGame, progressFor } from '@/lib/gameAchievements';

const tierColor: Record<string, string> = {
  bronze: 'bg-amber-700/20 text-amber-600 border-amber-700/40',
  silver: 'bg-slate-400/20 text-slate-400 border-slate-400/40',
  gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40',
  platinum: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/40',
  diamond: 'bg-fuchsia-400/20 text-fuchsia-400 border-fuchsia-400/40',
};

const GameAchievementsPanel: React.FC<{ gameId: string }> = ({ gameId }) => {
  const { gameStats, achievements } = useGame();
  const defs = useMemo(() => achievementsForGame(gameId), [gameId]);
  const stats = gameStats[gameId];
  const unlockedCount = defs.filter((d) => achievements.includes(d.achievement_id)).length;

  return (
    <Card className="p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Game Achievements</h3>
        </div>
        <Badge variant="secondary">{unlockedCount}/{defs.length}</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {defs.map((d) => {
          const done = achievements.includes(d.achievement_id);
          const pct = Math.round(progressFor(d, stats) * 100);
          return (
            <div
              key={d.achievement_id}
              className={`rounded-lg border p-3 transition-all ${done ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-sm">{d.title}</span>
                <span className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 border ${tierColor[d.tier]}`}>
                  {d.tier}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{d.description}</p>
              <div className="flex items-center gap-2">
                <Progress value={done ? 100 : pct} className="h-1.5 flex-1" />
                {done ? <Check className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default GameAchievementsPanel;

import { supabase } from '@/integrations/supabase/client';
import { ALL_GAMES } from '@/lib/gamesCatalog';

export type GoalType = 'score' | 'plays' | 'time' | 'win';

export interface GameAchievementDef {
  achievement_id: string;
  game_id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  goal_type: GoalType;
  goal_target: number;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
}

const TIERS: GameAchievementDef['tier'][] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

/**
 * Deterministic per-game achievement set (6 per game) so every title has its own
 * unlockables without needing a hand-written table for 90+ games.
 */
export function achievementsForGame(gameId: string): GameAchievementDef[] {
  const meta = ALL_GAMES.find((g) => g.id === gameId);
  const name = meta?.title ?? gameId;

  const scoreSteps = [500, 2500, 10000, 50000, 150000];
  const playSteps = [1, 10, 50, 200];

  const defs: GameAchievementDef[] = [];

  defs.push({
    achievement_id: `${gameId}:first-play`,
    game_id: gameId,
    title: 'First Contact',
    description: `Play ${name} for the first time.`,
    icon: 'play',
    tier: 'bronze',
    goal_type: 'plays',
    goal_target: playSteps[0],
    reward_coins: 50,
    reward_gems: 0,
    reward_xp: 25,
  });

  scoreSteps.forEach((target, i) => {
    defs.push({
      achievement_id: `${gameId}:score-${target}`,
      game_id: gameId,
      title: `${['Warm Up', 'Getting Good', 'Sharp Shooter', 'Elite', 'Untouchable'][i]}`,
      description: `Score ${target.toLocaleString()} in ${name}.`,
      icon: 'target',
      tier: TIERS[i],
      goal_type: 'score',
      goal_target: target,
      reward_coins: 100 * (i + 1),
      reward_gems: i >= 2 ? (i - 1) * 5 : 0,
      reward_xp: 50 * (i + 1),
    });
  });

  playSteps.slice(1).forEach((target, i) => {
    defs.push({
      achievement_id: `${gameId}:plays-${target}`,
      game_id: gameId,
      title: `${['Regular', 'Devoted', 'Obsessed'][i]}`,
      description: `Play ${name} ${target} times.`,
      icon: 'repeat',
      tier: TIERS[i + 1],
      goal_type: 'plays',
      goal_target: target,
      reward_coins: 150 * (i + 1),
      reward_gems: i * 5,
      reward_xp: 75 * (i + 1),
    });
  });

  return defs;
}

export function progressFor(
  def: GameAchievementDef,
  stats: { highScore: number; gamesPlayed: number; timePlayed: number } | undefined,
): number {
  if (!stats) return 0;
  if (def.goal_type === 'score') return Math.min(1, stats.highScore / def.goal_target);
  if (def.goal_type === 'plays') return Math.min(1, stats.gamesPlayed / def.goal_target);
  if (def.goal_type === 'time') return Math.min(1, stats.timePlayed / def.goal_target);
  return 0;
}

/** Awards any newly-completed per-game achievements. Returns the ones unlocked. */
export async function syncGameAchievements(
  userId: string,
  gameId: string,
  stats: { highScore: number; gamesPlayed: number; timePlayed: number },
): Promise<GameAchievementDef[]> {
  const defs = achievementsForGame(gameId);
  const ids = defs.map((d) => d.achievement_id);

  const { data: owned } = await supabase
    .from('achievements')
    .select('achievement_id')
    .eq('user_id', userId)
    .in('achievement_id', ids);

  const ownedSet = new Set((owned ?? []).map((o) => o.achievement_id));
  const newly = defs.filter((d) => !ownedSet.has(d.achievement_id) && progressFor(d, stats) >= 1);
  if (!newly.length) return [];

  await supabase
    .from('achievements')
    .insert(newly.map((d) => ({ user_id: userId, achievement_id: d.achievement_id })));

  return newly;
}

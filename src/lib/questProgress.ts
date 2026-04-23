// Hook to bump quest progress whenever the player completes a game.
// Reads active quests, then increments matching rows in user_quest_progress
// using upsert semantics so new periods auto-create rows.
import { supabase } from '@/integrations/supabase/client';

const periodStartFor = (type: 'daily' | 'weekly' | 'seasonal'): string => {
  const now = new Date();
  if (type === 'daily') return now.toISOString().slice(0, 10);
  if (type === 'weekly') {
    const day = now.getUTCDay() || 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (day - 1));
    return monday.toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

interface BumpInput {
  userId: string;
  score: number;
  isWin?: boolean;
}

export const bumpQuestProgress = async ({ userId, score, isWin }: BumpInput) => {
  try {
    const { data: quests } = await supabase.from('quests').select('*').eq('active', true);
    if (!quests?.length) return;

    for (const q of quests) {
      const period = periodStartFor(q.quest_type as 'daily' | 'weekly' | 'seasonal');
      let increment = 0;
      if (q.goal_type === 'games_played') increment = 1;
      else if (q.goal_type === 'score_total') increment = score;
      else if (q.goal_type === 'wins' && isWin) increment = 1;
      if (increment <= 0) continue;

      // Read existing row (so we can add to it)
      const { data: existing } = await supabase
        .from('user_quest_progress')
        .select('progress, claimed')
        .eq('user_id', userId)
        .eq('quest_key', q.quest_key)
        .eq('period_start', period)
        .maybeSingle();

      if (existing?.claimed) continue;
      const newProgress = (existing?.progress || 0) + increment;
      await supabase.from('user_quest_progress').upsert({
        user_id: userId,
        quest_key: q.quest_key,
        period_start: period,
        progress: Math.min(newProgress, q.goal_target),
        claimed: false,
      }, { onConflict: 'user_id,quest_key,period_start' });
    }
  } catch (e) {
    // Non-fatal — quest progress isn't worth interrupting gameplay
    console.warn('Quest bump failed', e);
  }
};

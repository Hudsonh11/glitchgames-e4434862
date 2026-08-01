import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';

export const EMOTES = ['🔥', '😂', '😮', '👏', '💀', '🎯', '❤️', '🧊'];

interface FloatingEmote {
  id: string;
  emote: string;
}

interface Props {
  sessionId?: string;
  targetUserId?: string;
  compact?: boolean;
}

const EmoteBar: React.FC<Props> = ({ sessionId, targetUserId, compact }) => {
  const { user } = useGame();
  const [floating, setFloating] = useState<FloatingEmote[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`emotes-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_reactions', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const emote = (payload.new as { emote: string }).emote;
          const id = crypto.randomUUID();
          setFloating((f) => [...f, { id, emote }]);
          setTimeout(() => setFloating((f) => f.filter((x) => x.id !== id)), 1800);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  const send = async (emote: string) => {
    if (!user) return;
    const id = crypto.randomUUID();
    setFloating((f) => [...f, { id, emote }]);
    setTimeout(() => setFloating((f) => f.filter((x) => x.id !== id)), 1800);
    await supabase.from('match_reactions').insert({
      user_id: user.id,
      session_id: sessionId ?? null,
      target_user_id: targetUserId ?? null,
      emote,
    });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-16 flex justify-center gap-2 overflow-visible">
        {floating.map((f) => (
          <span key={f.id} className="text-3xl animate-fade-in" aria-hidden="true">{f.emote}</span>
        ))}
      </div>
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'justify-center'}`}>
        {EMOTES.map((e) => (
          <Button
            key={e}
            size="sm"
            variant="secondary"
            className="text-lg px-2.5 hover-scale"
            aria-label={`Send ${e} reaction`}
            onClick={() => send(e)}
          >
            {e}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EmoteBar;

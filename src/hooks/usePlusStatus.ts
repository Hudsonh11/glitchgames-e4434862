import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlusStatus {
  isActive: boolean;
  expiresAt: Date | null;
  daysRemaining: number;
  source: 'purchase' | 'admin_gift' | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Reads the most recent active Plus subscription for the current user.
 * "Active" means status='active' AND expires_at > now.
 */
export function usePlusStatus(userId?: string): PlusStatus {
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [source, setSource] = useState<'purchase' | 'admin_gift' | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setExpiresAt(null);
      setSource(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('plus_subscriptions')
      .select('expires_at, source, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = data as { expires_at?: string; source?: 'purchase' | 'admin_gift' } | null;
    setExpiresAt(row?.expires_at ? new Date(row.expires_at) : null);
    setSource(row?.source ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Realtime updates so admin gifts / new purchases reflect instantly.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`plus-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plus_subscriptions', filter: `user_id=eq.${userId}` },
        () => { load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  const now = Date.now();
  const isActive = !!expiresAt && expiresAt.getTime() > now;
  const daysRemaining = isActive && expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return { isActive, expiresAt, daysRemaining, source, loading, refresh: load };
}

import React, { useState, useEffect } from 'react';
import { Megaphone, X, Sparkles, Gift, Zap, Info, AlertTriangle, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from './UltraCard';
import UltraBadge from './UltraBadge';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
  priority: number;
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  info: { icon: Info, color: 'primary', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'warning', label: 'Warning' },
  update: { icon: Zap, color: 'secondary', label: 'Update' },
  event: { icon: Calendar, color: 'success', label: 'Event' },
  promotion: { icon: Gift, color: 'warning', label: 'Promotion' },
};

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const DISMISS_KEY = 'dismissedAnnouncements';

const Announcements: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id, type, title, content, created_at, priority')
      .eq('active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);
    setItems((data as Announcement[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('announcements-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next.slice(-100)));
  };

  const visible = items.filter(a => !dismissed.includes(a.id));
  if (loading || visible.length === 0) return null;

  return (
    <UltraCard variant="glass" className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Announcements</h3>
        <UltraBadge variant="rare" size="sm">{visible.length}</UltraBadge>
      </div>

      <div className="space-y-3">
        {visible.map((a) => {
          const config = typeConfig[a.type] || typeConfig.info;
          const Icon = config.icon;
          const isNew = (Date.now() - new Date(a.created_at).getTime()) < 24 * 60 * 60 * 1000;

          return (
            <div
              key={a.id}
              className="relative flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `hsl(var(--${config.color}) / 0.2)` }}
              >
                <Icon className={`w-5 h-5 text-${config.color}`} />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <UltraBadge variant={config.color as any} size="sm">{config.label}</UltraBadge>
                  {isNew && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                </div>
                <h4 className="font-semibold text-foreground text-sm break-words">{a.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 break-words whitespace-pre-wrap">{a.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatTime(a.created_at)}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 w-6 h-6 p-0"
                onClick={() => dismiss(a.id)}
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </UltraCard>
  );
};

export default Announcements;

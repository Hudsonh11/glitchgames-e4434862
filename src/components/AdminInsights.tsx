import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, Zap, AlertCircle, Database, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InsightStat {
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ElementType;
  color: string;
}

const AdminInsights: React.FC = () => {
  const [stats, setStats] = useState<InsightStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topGames, setTopGames] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [profilesRes, gameStatsRes, bugRes, activityRes, purchasesRes] = await Promise.all([
        supabase.from('profiles').select('id, created_at, level, xp'),
        supabase.from('game_stats').select('game_id, games_played, high_score'),
        supabase.from('bug_reports').select('id, status'),
        supabase.from('activity_feed').select('*').order('created_at', { ascending: false }).limit(15),
        supabase.from('battle_pass_purchases').select('amount_cents').eq('status', 'completed'),
      ]);

      const profiles = profilesRes.data ?? [];
      const gs = gameStatsRes.data ?? [];
      const bugs = bugRes.data ?? [];
      const purchases = purchasesRes.data ?? [];

      // Top games
      const gameMap: Record<string, number> = {};
      gs.forEach((g: any) => { gameMap[g.game_id] = (gameMap[g.game_id] ?? 0) + g.games_played; });
      const sorted = Object.entries(gameMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
      setTopGames(sorted);

      // Last 24h signups
      const dayAgo = Date.now() - 86400000;
      const newToday = profiles.filter((p: any) => new Date(p.created_at).getTime() > dayAgo).length;

      const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount_cents || 0), 0) / 100;
      const avgLevel = profiles.length ? (profiles.reduce((s: number, p: any) => s + (p.level || 1), 0) / profiles.length).toFixed(1) : '0';
      const openBugs = bugs.filter((b: any) => b.status === 'open').length;

      setStats([
        { label: 'New Users (24h)', value: newToday, trend: '+', icon: Users, color: 'text-success' },
        { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-warning' },
        { label: 'Premium Users', value: purchases.length, icon: Zap, color: 'text-secondary' },
        { label: 'Avg Level', value: avgLevel, icon: Activity, color: 'text-primary' },
        { label: 'Open Bug Reports', value: openBugs, icon: AlertCircle, color: openBugs > 5 ? 'text-destructive' : 'text-success' },
        { label: 'Total Games Played', value: gs.reduce((s: number, g: any) => s + g.games_played, 0).toLocaleString(), icon: Database, color: 'text-primary' },
      ]);

      setRecentActivity(activityRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="ultra-card p-5">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              {s.trend && <span className="text-xs font-bold text-success">{s.trend}</span>}
            </div>
            <div className="text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="ultra-card p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-warning" /> Most Played Games
          </h3>
          {topGames.length ? (
            <div className="space-y-2">
              {topGames.map(([id, count], i) => {
                const max = topGames[0][1] as number;
                const pct = ((count as number) / max) * 100;
                return (
                  <div key={id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{i + 1}. {id}</span>
                      <span className="text-muted-foreground">{count} plays</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-hero rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No game data yet</p>
          )}
        </div>

        <div className="ultra-card p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Live Activity Feed
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recentActivity.length ? recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
                <div className="flex-1">
                  <p className="font-medium">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInsights;

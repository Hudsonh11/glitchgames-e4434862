import React, { useEffect, useState } from 'react';
import { Crown, Megaphone, ScrollText, Send, Loader2, Search, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import UltraCard from '@/components/UltraCard';

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
}

interface ProfileLite {
  user_id: string;
  username: string;
}

const AdminPower: React.FC = () => {
  const { user, allUsers } = useGame();
  const { toast } = useToast();

  // Battle pass grant
  const [grantQuery, setGrantQuery] = useState('');
  const [grantTarget, setGrantTarget] = useState<ProfileLite | null>(null);
  const [grantLoading, setGrantLoading] = useState(false);

  // Broadcast
  const [bcTitle, setBcTitle] = useState('');
  const [bcContent, setBcContent] = useState('');
  const [bcSending, setBcSending] = useState(false);

  // Reset Battle Pass
  const [resetUsername, setResetUsername] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetAllLoading, setResetAllLoading] = useState(false);

  // Audit log
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const loadAudit = async () => {
    setAuditLoading(true);
    const { data } = await supabase
      .from('admin_audit_log')
      .select('id, admin_id, action, target_type, target_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setAudit(data || []);
    setAuditLoading(false);
  };

  useEffect(() => { loadAudit(); }, []);

  const matchedUsers = grantQuery.length >= 2
    ? allUsers.filter(u => u.username.toLowerCase().includes(grantQuery.toLowerCase())).slice(0, 5)
    : [];

  const grantBattlePass = async () => {
    if (!grantTarget || !user?.id) return;
    setGrantLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-grant-pass', {
        body: { target_user_id: grantTarget.user_id, season: 'season_1' },
      });
      if (error) throw error;
      toast({
        title: data?.already_had ? 'Already had pass' : 'Battle Pass Granted',
        description: `${grantTarget.username} now has Premium.`,
      });
      setGrantTarget(null);
      setGrantQuery('');
      loadAudit();
    } catch (e) {
      console.error(e);
      toast({ title: 'Grant failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setGrantLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!bcTitle.trim() || !bcContent.trim() || !user?.id) return;
    setBcSending(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title: bcTitle.trim(),
        content: bcContent.trim(),
        type: 'info',
        priority: 10,
        active: true,
        author_id: user.id,
      });
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: user.id,
        action: 'broadcast',
        target_type: 'announcement',
        details: { title: bcTitle.trim() },
      });
      toast({ title: 'Broadcast sent', description: 'All players will see it.' });
      setBcTitle(''); setBcContent('');
      loadAudit();
    } catch (e) {
      toast({ title: 'Send failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBcSending(false);
    }
  };

  const adminName = (id: string) => allUsers.find(u => u.id === id)?.username || id.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Battle Pass Grant */}
      <UltraCard variant="glass" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-warning" />
          <h3 className="font-display text-lg font-bold">Grant Battle Pass</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Give a player Premium for free (compensation, contest reward, etc.). Idempotent — safe to retry.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username…"
              value={grantTarget?.username || grantQuery}
              onChange={(e) => { setGrantTarget(null); setGrantQuery(e.target.value); }}
              className="pl-9"
            />
            {matchedUsers.length > 0 && !grantTarget && (
              <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {matchedUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setGrantTarget({ user_id: u.id, username: u.username })}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  >
                    {u.username}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={grantBattlePass} disabled={!grantTarget || grantLoading} variant="gaming">
            {grantLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Crown className="w-4 h-4 mr-1" />}
            Grant
          </Button>
        </div>
      </UltraCard>

      {/* Broadcast */}
      <UltraCard variant="glass" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Quick Broadcast</h3>
        </div>
        <div className="space-y-2">
          <Input placeholder="Title" value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} maxLength={80} />
          <Textarea placeholder="Message…" value={bcContent} onChange={(e) => setBcContent(e.target.value)} rows={3} maxLength={500} />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{bcContent.length}/500</span>
            <Button onClick={sendBroadcast} disabled={!bcTitle.trim() || !bcContent.trim() || bcSending} variant="gaming" size="sm">
              {bcSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Send to all players
            </Button>
          </div>
        </div>
      </UltraCard>

      {/* Audit Log */}
      <UltraCard variant="glass" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg font-bold">Recent Admin Actions</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAudit} disabled={auditLoading}>
            <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
          ) : audit.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No admin actions logged yet.</p>
          ) : (
            audit.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{e.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    by {adminName(e.admin_id)} · {e.target_type}{e.target_id ? ` · ${e.target_id.slice(0, 8)}` : ''}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(e.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </UltraCard>
    </div>
  );
};

export default AdminPower;

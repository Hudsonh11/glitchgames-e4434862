import React, { useEffect, useState } from 'react';
import { Crown, Megaphone, ScrollText, Send, Loader2, Search, RefreshCw, Trash2, AlertTriangle, Coins, Zap } from 'lucide-react';
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

  // Plus gift
  const [plusQuery, setPlusQuery] = useState('');
  const [plusTarget, setPlusTarget] = useState<ProfileLite | null>(null);
  const [plusMonths, setPlusMonths] = useState(1);
  const [plusLoading, setPlusLoading] = useState(false);

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

  const matchedPlusUsers = plusQuery.length >= 2
    ? allUsers.filter(u => u.username.toLowerCase().includes(plusQuery.toLowerCase())).slice(0, 5)
    : [];

  const giftPlus = async () => {
    if (!plusTarget || !user?.id) return;
    setPlusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-grant-plus', {
        body: { target_user_id: plusTarget.user_id, months: plusMonths },
      });
      if (error) throw error;
      toast({
        title: '⚡ Plus Gifted',
        description: `${plusTarget.username} got ${plusMonths} month${plusMonths > 1 ? 's' : ''} of Plus.`,
      });
      setPlusTarget(null);
      setPlusQuery('');
      setPlusMonths(1);
      loadAudit();
    } catch (e) {
      toast({ title: 'Gift failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPlusLoading(false);
    }
  };

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

  const revokeOne = async () => {
    if (!resetUsername.trim()) return;
    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-pass', {
        body: { username: resetUsername.trim(), season: 'season_1' },
      });
      if (error) throw error;
      toast({
        title: data?.revoked > 0 ? 'Battle Pass Revoked' : 'Nothing to revoke',
        description: data?.revoked > 0
          ? `Removed Premium from ${resetUsername.trim()}.`
          : `${resetUsername.trim()} did not have Premium.`,
      });
      setResetUsername('');
      loadAudit();
    } catch (e) {
      toast({ title: 'Revoke failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const revokeAll = async () => {
    setResetAllLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-pass', {
        body: { all: true, season: 'season_1' },
      });
      if (error) throw error;
      toast({
        title: 'All Battle Passes Reset',
        description: `Removed Premium from ${data?.revoked ?? 0} player(s).`,
      });
      loadAudit();
    } catch (e) {
      toast({ title: 'Reset failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setResetAllLoading(false);
    }
  };

  const adminName = (id: string) => allUsers.find(u => u.id === id)?.username || id.slice(0, 8);

  const [coinsLoading, setCoinsLoading] = useState(false);
  const giveMeMaxCoins = async () => {
    if (!user?.id) return;
    setCoinsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ coins: 999_999_999, gems: 999_999 })
        .eq('user_id', user.id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: user.id, action: 'self_grant_currency', target_type: 'profile', target_id: user.id,
        details: { coins: 999_999_999, gems: 999_999 },
      });
      toast({ title: '💰 Loaded up!', description: 'Refresh to see the new balance everywhere.' });
    } catch (e) {
      toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setCoinsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Self Grant Currency */}
      <UltraCard variant="premium" glow className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-warning" />
          <h3 className="font-display text-lg font-bold">Admin Cheat: Max Currency</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Sets your own balance to 999,999,999 coins and 999,999 gems. Logged in audit trail.
        </p>
        <Button onClick={giveMeMaxCoins} disabled={coinsLoading} variant="gaming" className="w-full">
          {coinsLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Coins className="w-4 h-4 mr-1" />}
          Give me infinite coins & gems
        </Button>
      </UltraCard>
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

      {/* Gift Glitch Games Plus */}
      <UltraCard variant="premium" glow className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Gift Glitch Games Plus</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Grant a player 1+ months of Plus (free). They get coins, gems, battle pass, and all Plus perks immediately.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username…"
              value={plusTarget?.username || plusQuery}
              onChange={(e) => { setPlusTarget(null); setPlusQuery(e.target.value); }}
              className="pl-9"
            />
            {matchedPlusUsers.length > 0 && !plusTarget && (
              <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {matchedPlusUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setPlusTarget({ user_id: u.id, username: u.username })}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  >
                    {u.username}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Input
            type="number"
            min={1}
            max={36}
            value={plusMonths}
            onChange={(e) => setPlusMonths(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
            className="w-full sm:w-24"
            placeholder="Months"
          />
          <Button onClick={giftPlus} disabled={!plusTarget || plusLoading} variant="gaming">
            {plusLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
            Gift
          </Button>
        </div>
      </UltraCard>


      {/* Reset Battle Pass */}
      <UltraCard variant="glass" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h3 className="font-display text-lg font-bold">Reset Battle Pass</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Remove Premium from a single player by username, or wipe Premium for everyone in the current season.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Input
            placeholder="Username to revoke…"
            value={resetUsername}
            onChange={(e) => setResetUsername(e.target.value)}
            className="flex-1"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!resetUsername.trim() || resetLoading} variant="destructive">
                {resetLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Revoke
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke Premium from {resetUsername.trim()}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes their Premium Battle Pass for season_1. They can repurchase or be re-granted later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={revokeOne}>Revoke</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={resetAllLoading} className="w-full">
              {resetAllLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
              Reset Premium for ALL Players
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset everyone's Battle Pass?</AlertDialogTitle>
              <AlertDialogDescription>
                Removes Premium from every player for season_1. Paid users will need to repurchase. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={revokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, reset all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

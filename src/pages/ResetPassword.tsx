import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Lock, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Seo from '@/components/Seo';

const strengthOf = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
};

const LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setValid(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setValid(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const strength = strengthOf(password);
  const canSubmit = password.length >= 8 && password === confirm && strength >= 2 && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      if (signOutOthers) {
        // Revokes every other refresh token immediately, server-side.
        await supabase.auth.signOut({ scope: 'others' });
      }
      // Refresh local session so the new credentials take effect instantly.
      await supabase.auth.refreshSession();

      setDone(true);
      toast({
        title: 'Password updated',
        description: signOutOthers
          ? 'All other devices have been signed out.'
          : 'Your other devices remain signed in.',
      });
      setTimeout(() => navigate('/profile'), 1800);
    } catch (err) {
      toast({ title: 'Could not update password', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Seo
        title="Reset Password — Glitch Games"
        description="Set a new password for your Glitch Games account and choose whether to stay signed in on your other devices."
        path="/reset-password"
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shadow-neon-cyan">
              <Gamepad2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-gradient">GLITCH GAMES</span>
          </Link>

          <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl">
            {!ready ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : done ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-success" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Password Changed</h1>
                <p className="text-muted-foreground">Redirecting you to your profile…</p>
              </div>
            ) : !valid ? (
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold mb-2">Link expired or invalid</h1>
                <p className="text-muted-foreground mb-6">
                  Recovery links are single-use and expire after 1 hour. Request a new one to continue.
                </p>
                <Link to="/recovery"><Button variant="gaming" className="w-full">Request new link</Button></Link>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-center mb-2">Set a new password</h1>
                <p className="text-muted-foreground text-center mb-6 text-sm">
                  Choose a strong password. The change applies immediately.
                </p>

                <form onSubmit={submit} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={show ? 'text' : 'password'}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-muted border-border"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={72}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={show ? 'Hide password' : 'Show password'}
                    >
                      {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-colors ${
                              i < strength
                                ? strength <= 1 ? 'bg-destructive' : strength === 2 ? 'bg-warning' : 'bg-success'
                                : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{LABELS[strength]} — 8+ chars, mix cases, numbers & symbols</p>
                    </div>
                  )}

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={show ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-10 h-12 bg-muted border-border"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {confirm.length > 0 && confirm !== password && (
                    <p className="text-xs text-destructive">Passwords don't match.</p>
                  )}

                  <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={signOutOthers}
                      onCheckedChange={(v) => setSignOutOthers(v === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">
                      <span className="font-medium">Sign out of all other devices</span>
                      <span className="block text-xs text-muted-foreground">
                        Recommended. Uncheck to keep your other sessions signed in.
                      </span>
                    </span>
                  </label>

                  <Button type="submit" variant="gaming" size="lg" className="w-full" disabled={!canSubmit}>
                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                    Update password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;

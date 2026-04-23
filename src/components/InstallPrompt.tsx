import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwaInstallDismissedAt';
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const InstallPrompt: React.FC = () => {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissed < COOLDOWN_MS) return;
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[60] animate-fade-in">
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-glow p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm">Install Glitch Games</p>
          <p className="text-xs text-muted-foreground mb-2">Play offline, faster launches.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="gaming" onClick={install} className="flex-1">Install</Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>Later</Button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;

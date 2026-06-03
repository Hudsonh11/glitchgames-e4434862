import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Gamepad2, Shield, Zap, Gift, Bug } from 'lucide-react';
import UltraBadge from '@/components/UltraBadge';

const changelog = [
  { version: '3.0.0', date: 'Jun 2026', type: 'feature' as const, items: [
    'Glitch Games Plus subscription (£7.99/mo, one-time, no auto-renew)',
    'Plus perks: 2× XP, weekly loot crate, bonus coins, exclusive title/border, early access, and more',
    'Admin gifting & revocation tools for Plus subscriptions',
    'New games: Find Match, Guess The Person (Plus-only), Crash It',
    'Pixel AI upgraded to Gemini 3 Flash Lite with expanded site knowledge',
    'Battle Pass line-item now reflects the current season dynamically',
    'Streak Freeze rebuilt as a real one-shot shield per 7-day tier',
    'More push-notification triggers across daily rewards, friends, and Plus',
  ] },
  { version: '2.5.0', date: 'Feb 2026', type: 'feature' as const, items: ['AI Support Bot (Pixel) with full platform knowledge', 'Cookie consent banner', 'Changelog viewer', 'Keyboard shortcuts guide', 'Game timer widget', 'Enhanced 404 page with glitch effects', 'Back to top button'] },
  { version: '2.4.0', date: 'Jan 2026', type: 'feature' as const, items: ['50+ playable games', 'Season pass system', 'Milestone tracker', 'Stats overview dashboard', 'Game completion modal', 'Online status indicator'] },
  { version: '2.3.0', date: 'Dec 2025', type: 'feature' as const, items: ['Profile customization shop', 'Friend system with messaging', 'Ranked competitive mode', 'Challenge system', 'Bug report modal'] },
  { version: '2.2.0', date: 'Nov 2025', type: 'improvement' as const, items: ['Leaderboard search & category filter', 'Welcome back widget', 'Game of the Day', 'Trending games section', 'Mini leaderboard on homepage'] },
  { version: '2.1.0', date: 'Oct 2025', type: 'fix' as const, items: ['Fixed delete account edge function', 'Fixed leaderboard data fetching', 'Improved settings persistence', 'Performance optimizations'] },
];

const typeIcons = { feature: Sparkles, improvement: Zap, fix: Bug };
const typeColors = { feature: 'text-primary', improvement: 'text-warning', fix: 'text-success' };

const ChangelogModal = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
        <Sparkles className="w-3 h-3" /> What's New
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-display">
          <Sparkles className="w-5 h-5 text-primary" /> Changelog
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-6 pr-4">
          {changelog.map((release) => {
            const Icon = typeIcons[release.type];
            return (
              <div key={release.version} className="relative pl-6 border-l-2 border-border">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-primary" />
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display font-bold">v{release.version}</span>
                  <UltraBadge variant="common" size="sm">{release.date}</UltraBadge>
                </div>
                <ul className="space-y-1">
                  {release.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${typeColors[release.type]}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export default ChangelogModal;

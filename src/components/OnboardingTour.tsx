import React, { useEffect, useState } from 'react';
import { X, ChevronRight, Sparkles, Trophy, Coins, Gamepad2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const STORAGE_KEY = 'onboardingCompleted_v1';

interface Step {
  icon: React.ElementType;
  title: string;
  body: string;
  cta?: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Glitch Games!',
    body: 'A massive collection of free browser games with leaderboards, daily rewards, and a full progression system. Let’s show you around.',
  },
  {
    icon: Gamepad2,
    title: '60+ Games at Your Fingertips',
    body: 'Browse by category on the homepage. Click any game card to start playing instantly — no downloads, no accounts required to try.',
  },
  {
    icon: Coins,
    title: 'Earn Coins & Gems',
    body: 'Every game you play earns coins. Spend them on cosmetics, titles, and avatar borders in the shop. Premium rewards drop in the Battle Pass.',
  },
  {
    icon: Trophy,
    title: 'Climb the Leaderboards',
    body: 'Top scores in every game are tracked globally. Compete in Ranked for 15+ titles to earn tier promotions.',
  },
  {
    icon: Users,
    title: 'Add Friends & Compete',
    body: 'Send friend requests by username, chat in real time, and challenge friends to head-to-head matches.',
    cta: 'Start Playing',
  },
];

const OnboardingTour: React.FC = () => {
  const { isLoggedIn } = useGame();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const showTutorials = localStorage.getItem('showTutorials') !== 'false';
    if (!showTutorials) return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    // Small delay so the page renders first
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) close();
    else setStep((s) => s + 1);
  };

  if (!visible) return null;
  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-glow overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Skip tutorial"
          className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-primary h-32 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-background/30 backdrop-blur-md flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <div className="p-6 space-y-3">
          <h3 className="font-display text-2xl font-bold">{s.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>

          <div className="flex items-center gap-1.5 pt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'bg-primary w-8' : 'bg-muted w-1.5'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-3">
            <Button variant="ghost" onClick={close} className="flex-1">
              Skip
            </Button>
            <Button variant="gaming" onClick={next} className="flex-1">
              {s.cta || 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;

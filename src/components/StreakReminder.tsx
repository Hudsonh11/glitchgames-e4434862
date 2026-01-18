import React, { useState, useEffect } from 'react';
import { Flame, X, Gift, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const StreakReminder: React.FC = () => {
  const { isLoggedIn, currentStreak, lastClaimDate } = useGame();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || dismissed) return;

    const today = new Date().toISOString().split('T')[0];
    const canClaim = lastClaimDate !== today;
    
    // Show reminder if user hasn't claimed today and has a streak
    if (canClaim && currentStreak > 0) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, currentStreak, lastClaimDate, dismissed]);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 animate-fade-in-up">
      <div className="relative bg-gradient-to-r from-warning/20 via-background to-destructive/20 border border-warning/30 rounded-xl p-4 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 w-6 h-6 p-0"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-destructive flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-foreground">Don't lose your streak!</span>
              <span className="text-warning font-bold">{currentStreak}🔥</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Claim your daily reward to keep your streak alive!
            </p>
            <Button variant="gaming" size="sm" className="w-full" asChild>
              <a href="/rewards">
                <Gift className="w-4 h-4 mr-2" />
                Claim Now
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakReminder;

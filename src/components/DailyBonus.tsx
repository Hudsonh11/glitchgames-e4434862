import React, { useState, useEffect } from 'react';
import { Gift, Clock, Sparkles, Coins, Gem, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from './UltraCard';
import UltraConfetti from './UltraConfetti';
import { useGame } from '@/contexts/GameContext';
import { usePlusStatus } from '@/hooks/usePlusStatus';
import { useToast } from '@/hooks/use-toast';

function isoWeekKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return `plusDailySkip_${d.toISOString().slice(0, 10)}`;
}

const DailyBonus: React.FC = () => {
  const { isLoggedIn, addCoins, addGems, currentStreak, user } = useGame();
  const plus = usePlusStatus(user?.id);
  const { toast } = useToast();
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [canClaim, setCanClaim] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [skipKey] = useState(isoWeekKey);
  const [skipUsed, setSkipUsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(isoWeekKey()) === '1' : false,
  );

  useEffect(() => {
    const checkClaimStatus = () => {
      const lastClaim = localStorage.getItem('lastBonusClaim');
      const today = new Date().toDateString();
      setCanClaim(lastClaim !== today);
    };

    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    checkClaimStatus();
    updateTimer();
    const interval = setInterval(() => {
      checkClaimStatus();
      updateTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const doClaim = async () => {
    const bonusCoins = 50 + (currentStreak * 10);
    const bonusGems = currentStreak >= 7 ? 5 : 0;
    await addCoins(bonusCoins);
    if (bonusGems > 0) await addGems(bonusGems);
    setClaimed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleClaim = async () => {
    if (!canClaim || !isLoggedIn) return;
    await doClaim();
    localStorage.setItem('lastBonusClaim', new Date().toDateString());
    setCanClaim(false);
  };

  const handleSkip = async () => {
    if (!plus.isActive || skipUsed || !isLoggedIn) return;
    // Grant an extra daily bonus immediately — do NOT overwrite lastBonusClaim,
    // so today's normal claim (if still available) stays available.
    await doClaim();
    localStorage.setItem(skipKey, '1');
    setSkipUsed(true);
    toast({
      title: '⚡ Plus cooldown skipped',
      description: 'Extra daily bonus claimed! Refills next Monday.',
    });
  };

  if (!isLoggedIn) return null;

  const canSkip = plus.isActive && !skipUsed && !canClaim;

  return (
    <>
      {showConfetti && <UltraConfetti active={true} />}
      <UltraCard variant="gradient" glow className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center animate-pulse">
              <Gift className="w-6 h-6 text-warning-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-1.5">
                Daily Bonus
                {plus.isActive && <Zap className="w-3.5 h-3.5 text-warning" aria-label="Plus" />}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Resets in {timeUntilReset}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-warning">
                <Coins className="w-4 h-4" />
                <span className="font-bold">{50 + (currentStreak * 10)}</span>
              </div>
              {currentStreak >= 7 && (
                <div className="flex items-center gap-1 text-secondary">
                  <Gem className="w-3 h-3" />
                  <span className="text-sm">+5</span>
                </div>
              )}
            </div>

            <Button
              variant={canClaim ? 'gaming' : 'outline'}
              size="sm"
              onClick={handleClaim}
              disabled={!canClaim || claimed}
              className="min-w-[80px]"
            >
              {claimed ? (
                <><Sparkles className="w-4 h-4 mr-1" />Claimed!</>
              ) : canClaim ? 'Claim' : 'Claimed'}
            </Button>
          </div>
        </div>

        {plus.isActive && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-warning" />
              <span>
                {skipUsed
                  ? 'Plus weekly skip used — refills Monday'
                  : 'Plus perk: skip today\'s cooldown once per week for an extra bonus'}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSkip}
              disabled={!canSkip}
              className="border-warning/50 hover:bg-warning/10"
            >
              {skipUsed ? 'Used' : canSkip ? 'Skip Cooldown' : 'Claim first'}
            </Button>
          </div>
        )}
      </UltraCard>
    </>
  );
};

export default DailyBonus;

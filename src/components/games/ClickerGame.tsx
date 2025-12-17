import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';
import { Pause, Zap, TrendingUp, Clock } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  owned: number;
}

const ClickerGame: React.FC = () => {
  const { updateGameStats, addCoins, unlockAchievement, coins: userCoins, spendCoins } = useGame();
  const [clicks, setClicks] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClicks, setAutoClicks] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  const [floatingNumbers, setFloatingNumbers] = useState<{ id: number; x: number; y: number; value: number }[]>([]);

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: 'power', name: 'Click Power', description: '+1 per click', cost: 50, multiplier: 1, owned: 0 },
    { id: 'auto', name: 'Auto Clicker', description: '+1 per second', cost: 100, multiplier: 1, owned: 0 },
    { id: 'boost', name: 'Click Boost', description: 'x2 click power', cost: 500, multiplier: 2, owned: 0 },
  ]);

  // Auto clicker
  useEffect(() => {
    if (autoClicks > 0 && !isPaused) {
      const interval = setInterval(() => {
        setClicks(prev => prev + autoClicks);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoClicks, isPaused]);

  // Check achievements
  useEffect(() => {
    if (clicks >= 100) unlockAchievement('clicker_100');
    if (clicks >= 1000) unlockAchievement('clicker_1000');
    if (clicks >= 10000) unlockAchievement('clicker_10000');
  }, [clicks, unlockAchievement]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isPaused) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClicks(prev => prev + clickPower);
    
    // Add floating number
    const id = Date.now();
    setFloatingNumbers(prev => [...prev, { id, x, y, value: clickPower }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(n => n.id !== id));
    }, 1000);
  }, [clickPower, isPaused]);

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const cost = Math.floor(upgrade.cost * Math.pow(1.5, upgrade.owned));
    if (clicks < cost) return;

    setClicks(prev => prev - cost);
    
    setUpgrades(prev => prev.map(u => {
      if (u.id === upgradeId) {
        return { ...u, owned: u.owned + 1 };
      }
      return u;
    }));

    if (upgradeId === 'power') {
      setClickPower(prev => prev + 1);
    } else if (upgradeId === 'auto') {
      setAutoClicks(prev => prev + 1);
    } else if (upgradeId === 'boost') {
      setClickPower(prev => prev * 2);
    }
  };

  const handleRestart = () => {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('clicker', clicks, timePlayed);
    addCoins(Math.floor(clicks / 100));
    
    setClicks(0);
    setClickPower(1);
    setAutoClicks(0);
    setUpgrades(prev => prev.map(u => ({ ...u, owned: 0 })));
  };

  const handleQuit = () => {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('clicker', clicks, timePlayed);
    addCoins(Math.floor(clicks / 100));
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Click Frenzy</h1>
            <p className="text-muted-foreground text-sm">Click to earn, upgrade to dominate!</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsPaused(true)}>
            <Pause className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Power</p>
            <p className="font-display font-bold text-primary">{clickPower}</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Auto/sec</p>
            <p className="font-display font-bold text-success">{autoClicks}</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="font-display font-bold text-warning">
              {Math.floor((Date.now() - startTime) / 1000)}s
            </p>
          </div>
        </div>

        {/* Main Click Area */}
        <div className="relative mb-6">
          <button
            onClick={handleClick}
            className="w-full aspect-square rounded-2xl bg-gradient-hero flex flex-col items-center justify-center transition-all duration-100 active:scale-95 hover:shadow-neon-cyan relative overflow-hidden"
          >
            <span className="font-display text-5xl font-black text-primary-foreground mb-2">
              {clicks.toLocaleString()}
            </span>
            <span className="text-primary-foreground/80 uppercase tracking-wider font-bold">
              TAP ME!
            </span>
            
            {/* Floating Numbers */}
            {floatingNumbers.map(({ id, x, y, value }) => (
              <span
                key={id}
                className="absolute font-display font-bold text-2xl text-primary-foreground animate-float pointer-events-none"
                style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
              >
                +{value}
              </span>
            ))}
          </button>
        </div>

        {/* Upgrades */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-lg">Upgrades</h3>
          {upgrades.map(upgrade => {
            const cost = Math.floor(upgrade.cost * Math.pow(1.5, upgrade.owned));
            const canAfford = clicks >= cost;
            
            return (
              <div
                key={upgrade.id}
                className="p-4 rounded-xl bg-card border border-border flex items-center justify-between"
              >
                <div>
                  <h4 className="font-display font-bold">{upgrade.name}</h4>
                  <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                  <p className="text-xs text-muted-foreground">Owned: {upgrade.owned}</p>
                </div>
                <Button
                  variant={canAfford ? "gaming" : "outline"}
                  onClick={() => buyUpgrade(upgrade.id)}
                  disabled={!canAfford}
                >
                  {cost.toLocaleString()}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Tutorial */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-2">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click the button to earn points</li>
            <li>• Buy upgrades to increase earnings</li>
            <li>• Auto Clicker earns points automatically</li>
          </ul>
        </div>
      </div>

      {/* Pause Menu */}
      <GamePauseMenu
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        onQuit={handleQuit}
        score={clicks}
      />
    </div>
  );
};

export default ClickerGame;

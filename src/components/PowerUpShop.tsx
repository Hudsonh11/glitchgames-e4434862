import React, { useState } from 'react';
import { Zap, Shield, Clock, Star, Coins, Gem, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from './UltraCard';
import UltraBadge from './UltraBadge';

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  currency: 'coins' | 'gems';
  duration: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: number;
  effect: string;
}

interface PowerUpShopProps {
  coins: number;
  gems: number;
  onPurchase?: (powerUpId: string, currency: 'coins' | 'gems', price: number) => void;
}

const PowerUpShop: React.FC<PowerUpShopProps> = ({ coins, gems, onPurchase }) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'coins' | 'gems'>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const powerUps: PowerUp[] = [
    {
      id: 'double_xp',
      name: 'Double XP',
      description: 'Earn 2x XP from all games',
      icon: <Star className="w-6 h-6" />,
      price: 500,
      currency: 'coins',
      duration: '30 min',
      rarity: 'rare',
      owned: 2,
      effect: '+100% XP',
    },
    {
      id: 'score_boost',
      name: 'Score Boost',
      description: '+25% score multiplier',
      icon: <Zap className="w-6 h-6" />,
      price: 300,
      currency: 'coins',
      duration: '15 min',
      rarity: 'common',
      owned: 5,
      effect: '+25% Score',
    },
    {
      id: 'shield',
      name: 'Extra Life',
      description: 'Get one extra life in games',
      icon: <Shield className="w-6 h-6" />,
      price: 50,
      currency: 'gems',
      duration: '1 game',
      rarity: 'epic',
      owned: 0,
      effect: '+1 Life',
    },
    {
      id: 'time_freeze',
      name: 'Time Freeze',
      description: 'Freeze timer for 10 seconds',
      icon: <Clock className="w-6 h-6" />,
      price: 75,
      currency: 'gems',
      duration: '1 use',
      rarity: 'legendary',
      owned: 1,
      effect: '10s Freeze',
    },
    {
      id: 'coin_magnet',
      name: 'Coin Magnet',
      description: 'Earn 50% more coins',
      icon: <Coins className="w-6 h-6" />,
      price: 400,
      currency: 'coins',
      duration: '1 hour',
      rarity: 'rare',
      owned: 0,
      effect: '+50% Coins',
    },
    {
      id: 'lucky_charm',
      name: 'Lucky Charm',
      description: 'Increased rare drop chance',
      icon: <Sparkles className="w-6 h-6" />,
      price: 100,
      currency: 'gems',
      duration: '3 games',
      rarity: 'legendary',
      owned: 0,
      effect: '+Luck',
    },
  ];

  const filteredPowerUps = powerUps.filter(p => 
    selectedTab === 'all' || p.currency === selectedTab
  );

  const handlePurchase = async (powerUp: PowerUp) => {
    const balance = powerUp.currency === 'coins' ? coins : gems;
    if (balance < powerUp.price) return;

    setPurchasing(powerUp.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    onPurchase?.(powerUp.id, powerUp.currency, powerUp.price);
    setPurchasing(null);
  };

  const getRarityColor = (rarity: PowerUp['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-muted-foreground bg-muted';
      case 'rare': return 'text-blue-400 bg-blue-500/20';
      case 'epic': return 'text-purple-400 bg-purple-500/20';
      case 'legendary': return 'text-warning bg-warning/20';
    }
  };

  return (
    <UltraCard variant="glass" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Power-Up Shop</h3>
            <p className="text-sm text-muted-foreground">Boost your gameplay!</p>
          </div>
        </div>
        
        {/* Balance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/20">
            <Coins className="w-4 h-4 text-warning" />
            <span className="font-bold text-warning">{coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/20">
            <Gem className="w-4 h-4 text-secondary" />
            <span className="font-bold text-secondary">{gems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'coins', 'gems'] as const).map(tab => (
          <Button
            key={tab}
            variant={selectedTab === tab ? 'gaming' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab(tab)}
            className="capitalize"
          >
            {tab === 'coins' && <Coins className="w-4 h-4 mr-1" />}
            {tab === 'gems' && <Gem className="w-4 h-4 mr-1" />}
            {tab}
          </Button>
        ))}
      </div>

      {/* Power-ups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPowerUps.map((powerUp) => {
          const canAfford = (powerUp.currency === 'coins' ? coins : gems) >= powerUp.price;
          const isPurchasing = purchasing === powerUp.id;

          return (
            <div
              key={powerUp.id}
              className={`relative p-4 rounded-xl border transition-all duration-300 ${
                canAfford 
                  ? 'bg-muted/30 border-border/50 hover:border-primary/50 hover:bg-muted/50' 
                  : 'bg-muted/10 border-border/30 opacity-60'
              }`}
            >
              {/* Rarity Badge */}
              <div className="absolute top-3 right-3">
                <UltraBadge variant={powerUp.rarity === 'legendary' ? 'legendary' : powerUp.rarity === 'epic' ? 'rare' : 'default'} size="sm">
                  {powerUp.rarity}
                </UltraBadge>
              </div>

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-3 rounded-xl ${getRarityColor(powerUp.rarity)}`}>
                  {powerUp.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">{powerUp.name}</h4>
                    {powerUp.owned > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/20 text-success">
                        x{powerUp.owned}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{powerUp.description}</p>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {powerUp.duration}
                    </span>
                    <span className="font-medium text-primary">{powerUp.effect}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {powerUp.currency === 'coins' ? (
                    <Coins className="w-4 h-4 text-warning" />
                  ) : (
                    <Gem className="w-4 h-4 text-secondary" />
                  )}
                  <span className={`font-bold ${powerUp.currency === 'coins' ? 'text-warning' : 'text-secondary'}`}>
                    {powerUp.price}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  variant={canAfford ? 'gaming' : 'outline'}
                  disabled={!canAfford || isPurchasing}
                  onClick={() => handlePurchase(powerUp)}
                >
                  {isPurchasing ? (
                    <span className="animate-pulse">Buying...</span>
                  ) : !canAfford ? (
                    <>
                      <Lock className="w-4 h-4 mr-1" />
                      Need More
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </UltraCard>
  );
};

export default PowerUpShop;

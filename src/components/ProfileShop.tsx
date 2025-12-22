import React, { useState } from 'react';
import { Sparkles, Crown, Palette, Star, Check, Lock, Coins, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  gemCost: number;
  type: 'avatar' | 'title' | 'border' | 'effect';
  icon: string;
  preview?: string;
}

const shopItems: ShopItem[] = [
  // Titles
  { id: 'title_pro', name: 'Pro Gamer', description: 'Show everyone you mean business', coinCost: 500, gemCost: 0, type: 'title', icon: '🎮' },
  { id: 'title_legend', name: 'Legend', description: 'Legendary status achieved', coinCost: 1000, gemCost: 0, type: 'title', icon: '⭐' },
  { id: 'title_champion', name: 'Champion', description: 'The ultimate title', coinCost: 0, gemCost: 50, type: 'title', icon: '🏆' },
  { id: 'title_elite', name: 'Elite Player', description: 'Top tier gaming', coinCost: 0, gemCost: 25, type: 'title', icon: '💎' },
  
  // Avatar frames
  { id: 'border_neon', name: 'Neon Frame', description: 'Glowing neon border', coinCost: 750, gemCost: 0, type: 'border', icon: '🌈' },
  { id: 'border_gold', name: 'Gold Frame', description: 'Premium gold border', coinCost: 0, gemCost: 30, type: 'border', icon: '✨' },
  { id: 'border_fire', name: 'Fire Frame', description: 'Blazing hot border', coinCost: 1500, gemCost: 0, type: 'border', icon: '🔥' },
  { id: 'border_ice', name: 'Ice Frame', description: 'Cool ice border', coinCost: 1500, gemCost: 0, type: 'border', icon: '❄️' },
  
  // Effects
  { id: 'effect_sparkle', name: 'Sparkle Effect', description: 'Sparkles on your profile', coinCost: 2000, gemCost: 0, type: 'effect', icon: '✨' },
  { id: 'effect_rainbow', name: 'Rainbow Glow', description: 'Rainbow aura effect', coinCost: 0, gemCost: 75, type: 'effect', icon: '🌈' },
  { id: 'effect_crown', name: 'Crown Effect', description: 'Floating crown above avatar', coinCost: 0, gemCost: 100, type: 'effect', icon: '👑' },
  
  // XP Boosts
  { id: 'xp_boost_small', name: 'XP Boost (Small)', description: '+100 XP instantly', coinCost: 300, gemCost: 0, type: 'effect', icon: '📈' },
  { id: 'xp_boost_large', name: 'XP Boost (Large)', description: '+500 XP instantly', coinCost: 0, gemCost: 20, type: 'effect', icon: '🚀' },
];

interface ProfileShopProps {
  purchasedItems: string[];
  onPurchase: (itemId: string) => void;
}

const ProfileShop: React.FC<ProfileShopProps> = ({ purchasedItems, onPurchase }) => {
  const { coins, gems, spendCoins, spendGems, user, addCoins, addGems } = useGame();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<'all' | 'title' | 'border' | 'effect'>('all');

  const filteredItems = selectedType === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.type === selectedType);

  const handlePurchase = async (item: ShopItem) => {
    if (purchasedItems.includes(item.id)) {
      toast({
        title: 'Already Owned',
        description: 'You already own this item!',
        variant: 'destructive',
      });
      return;
    }

    let success = false;
    
    if (item.gemCost > 0) {
      success = await spendGems(item.gemCost);
    } else {
      success = await spendCoins(item.coinCost);
    }

    if (success) {
      onPurchase(item.id);
      
      // Handle XP boosts immediately
      if (item.id === 'xp_boost_small' || item.id === 'xp_boost_large') {
        toast({
          title: 'XP Boost Applied! 🚀',
          description: `+${item.id === 'xp_boost_small' ? 100 : 500} XP added to your profile!`,
        });
      } else {
        toast({
          title: 'Purchase Successful! 🎉',
          description: `You now own ${item.name}!`,
        });
      }
    } else {
      toast({
        title: 'Insufficient Funds',
        description: `You need more ${item.gemCost > 0 ? 'gems' : 'coins'} for this item.`,
        variant: 'destructive',
      });
    }
  };

  const canAfford = (item: ShopItem) => {
    if (item.gemCost > 0) return gems >= item.gemCost;
    return coins >= item.coinCost;
  };

  return (
    <div className="space-y-6">
      {/* Currency Display */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          <span className="font-display text-xl font-bold text-warning">{coins.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          <span className="font-display text-xl font-bold text-secondary">{gems.toLocaleString()}</span>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'title', 'border', 'effect'] as const).map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'gaming' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="capitalize"
          >
            {type === 'all' ? 'All Items' : `${type}s`}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const owned = purchasedItems.includes(item.id);
          const affordable = canAfford(item);
          
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                owned
                  ? 'bg-success/10 border-success/50'
                  : affordable
                  ? 'bg-card border-border hover:border-primary hover:shadow-neon-cyan'
                  : 'bg-muted/30 border-border opacity-70'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{item.icon}</span>
                {owned && (
                  <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Owned
                  </span>
                )}
              </div>
              
              <h3 className="font-display font-bold mb-1">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-medium">
                  {item.gemCost > 0 ? (
                    <>
                      <span className="text-lg">💎</span>
                      <span className="text-secondary">{item.gemCost}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🪙</span>
                      <span className="text-warning">{item.coinCost}</span>
                    </>
                  )}
                </div>
                
                <Button
                  variant={owned ? 'outline' : 'gaming'}
                  size="sm"
                  disabled={owned || !affordable}
                  onClick={() => handlePurchase(item)}
                >
                  {owned ? 'Owned' : 'Buy'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileShop;

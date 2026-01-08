import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Frame, Palette, Check, Lock, Coins, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CustomizationItem {
  id: string;
  name: string;
  preview: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  coinCost: number;
  gemCost: number;
  requirement?: string;
}

const TITLES: CustomizationItem[] = [
  { id: 'newbie', name: 'Newbie', preview: '🌱', rarity: 'common', coinCost: 0, gemCost: 0 },
  { id: 'gamer', name: 'Gamer', preview: '🎮', rarity: 'common', coinCost: 100, gemCost: 0 },
  { id: 'pro', name: 'Pro Player', preview: '⭐', rarity: 'rare', coinCost: 500, gemCost: 0 },
  { id: 'champion', name: 'Champion', preview: '🏆', rarity: 'rare', coinCost: 1000, gemCost: 0 },
  { id: 'legend', name: 'Legend', preview: '🔥', rarity: 'epic', coinCost: 0, gemCost: 50 },
  { id: 'master', name: 'Grand Master', preview: '👑', rarity: 'epic', coinCost: 0, gemCost: 100 },
  { id: 'mythic', name: 'Mythic', preview: '💎', rarity: 'legendary', coinCost: 0, gemCost: 200 },
  { id: 'godlike', name: 'Godlike', preview: '⚡', rarity: 'legendary', coinCost: 0, gemCost: 500, requirement: 'Reach level 50' },
];

const BORDERS: CustomizationItem[] = [
  { id: 'default', name: 'Default', preview: '⬜', rarity: 'common', coinCost: 0, gemCost: 0 },
  { id: 'bronze', name: 'Bronze', preview: '🟤', rarity: 'common', coinCost: 200, gemCost: 0 },
  { id: 'silver', name: 'Silver', preview: '⚪', rarity: 'rare', coinCost: 500, gemCost: 0 },
  { id: 'gold', name: 'Gold', preview: '🟡', rarity: 'rare', coinCost: 1000, gemCost: 0 },
  { id: 'diamond', name: 'Diamond', preview: '💠', rarity: 'epic', coinCost: 0, gemCost: 75 },
  { id: 'rainbow', name: 'Rainbow', preview: '🌈', rarity: 'epic', coinCost: 0, gemCost: 150 },
  { id: 'animated-fire', name: 'Fire Aura', preview: '🔥', rarity: 'legendary', coinCost: 0, gemCost: 300 },
  { id: 'animated-cosmic', name: 'Cosmic', preview: '🌌', rarity: 'legendary', coinCost: 0, gemCost: 500 },
];

const THEMES: CustomizationItem[] = [
  { id: 'default', name: 'Default Dark', preview: '🌙', rarity: 'common', coinCost: 0, gemCost: 0 },
  { id: 'ocean', name: 'Ocean Blue', preview: '🌊', rarity: 'common', coinCost: 300, gemCost: 0 },
  { id: 'forest', name: 'Forest Green', preview: '🌲', rarity: 'common', coinCost: 300, gemCost: 0 },
  { id: 'sunset', name: 'Sunset Orange', preview: '🌅', rarity: 'rare', coinCost: 600, gemCost: 0 },
  { id: 'cherry', name: 'Cherry Blossom', preview: '🌸', rarity: 'rare', coinCost: 600, gemCost: 0 },
  { id: 'neon', name: 'Neon Nights', preview: '💜', rarity: 'epic', coinCost: 0, gemCost: 100 },
  { id: 'galaxy', name: 'Galaxy', preview: '🌌', rarity: 'epic', coinCost: 0, gemCost: 150 },
  { id: 'holographic', name: 'Holographic', preview: '✨', rarity: 'legendary', coinCost: 0, gemCost: 400 },
];

const ProfileCustomization: React.FC = () => {
  const { user, isLoggedIn, coins, gems, spendCoins, spendGems } = useGame();
  const { toast } = useToast();
  const [ownedTitles, setOwnedTitles] = useState<string[]>(['newbie']);
  const [ownedBorders, setOwnedBorders] = useState<string[]>(['default']);
  const [ownedThemes, setOwnedThemes] = useState<string[]>(['default']);
  const [equippedTitle, setEquippedTitle] = useState('newbie');
  const [equippedBorder, setEquippedBorder] = useState('default');
  const [equippedTheme, setEquippedTheme] = useState('default');

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchCustomizations();
    }
  }, [isLoggedIn, user]);

  const fetchCustomizations = async () => {
    if (!user) return;

    const [titlesRes, bordersRes, themesRes] = await Promise.all([
      supabase.from('player_titles').select('*').eq('user_id', user.id),
      supabase.from('player_borders').select('*').eq('user_id', user.id),
      supabase.from('player_themes').select('*').eq('user_id', user.id)
    ]);

    if (titlesRes.data) {
      setOwnedTitles(['newbie', ...titlesRes.data.map(t => t.title_id)]);
      const equipped = titlesRes.data.find(t => t.equipped);
      if (equipped) setEquippedTitle(equipped.title_id);
    }

    if (bordersRes.data) {
      setOwnedBorders(['default', ...bordersRes.data.map(b => b.border_id)]);
      const equipped = bordersRes.data.find(b => b.equipped);
      if (equipped) setEquippedBorder(equipped.border_id);
    }

    if (themesRes.data) {
      setOwnedThemes(['default', ...themesRes.data.map(t => t.theme_id)]);
      const equipped = themesRes.data.find(t => t.equipped);
      if (equipped) setEquippedTheme(equipped.theme_id);
    }
  };

  const purchaseItem = async (type: 'title' | 'border' | 'theme', item: CustomizationItem) => {
    if (!user) return;

    let canAfford = false;
    if (item.coinCost > 0 && coins >= item.coinCost) {
      canAfford = await spendCoins(item.coinCost);
    } else if (item.gemCost > 0 && gems >= item.gemCost) {
      canAfford = await spendGems(item.gemCost);
    } else if (item.coinCost === 0 && item.gemCost === 0) {
      canAfford = true;
    }

    if (!canAfford) {
      toast({
        title: 'Not enough currency',
        description: 'You need more coins or gems to purchase this item',
        variant: 'destructive'
      });
      return;
    }

    const column = type === 'title' ? 'title_id' : type === 'border' ? 'border_id' : 'theme_id';

    let error = null;
    if (type === 'title') {
      const { error: e } = await supabase.from('player_titles').insert({
        user_id: user.id,
        title_id: item.id
      });
      error = e;
    } else if (type === 'border') {
      const { error: e } = await supabase.from('player_borders').insert({
        user_id: user.id,
        border_id: item.id
      });
      error = e;
    } else {
      const { error: e } = await supabase.from('player_themes').insert({
        user_id: user.id,
        theme_id: item.id
      });
      error = e;
    }

    if (!error) {
      if (type === 'title') setOwnedTitles(prev => [...prev, item.id]);
      else if (type === 'border') setOwnedBorders(prev => [...prev, item.id]);
      else setOwnedThemes(prev => [...prev, item.id]);

      toast({
        title: 'Purchased!',
        description: `${item.name} has been added to your collection`
      });
    }
  };

  const equipItem = async (type: 'title' | 'border' | 'theme', itemId: string) => {
    if (!user) return;

    // Unequip all items of this type and equip the selected one
    if (type === 'title') {
      await supabase.from('player_titles').update({ equipped: false }).eq('user_id', user.id);
      if (itemId !== 'newbie' && itemId !== 'default') {
        await supabase.from('player_titles').update({ equipped: true }).eq('user_id', user.id).eq('title_id', itemId);
      }
    } else if (type === 'border') {
      await supabase.from('player_borders').update({ equipped: false }).eq('user_id', user.id);
      if (itemId !== 'newbie' && itemId !== 'default') {
        await supabase.from('player_borders').update({ equipped: true }).eq('user_id', user.id).eq('border_id', itemId);
      }
    } else {
      await supabase.from('player_themes').update({ equipped: false }).eq('user_id', user.id);
      if (itemId !== 'newbie' && itemId !== 'default') {
        await supabase.from('player_themes').update({ equipped: true }).eq('user_id', user.id).eq('theme_id', itemId);
      }
    }

    if (type === 'title') setEquippedTitle(itemId);
    else if (type === 'border') setEquippedBorder(itemId);
    else setEquippedTheme(itemId);

    toast({
      title: 'Equipped!',
      description: 'Your profile has been updated'
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-muted-foreground';
      case 'rare': return 'border-blue-500';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-warning';
      default: return 'border-border';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-muted/50';
      case 'rare': return 'bg-blue-500/10';
      case 'epic': return 'bg-purple-500/10';
      case 'legendary': return 'bg-warning/10';
      default: return 'bg-card';
    }
  };

  const renderItems = (items: CustomizationItem[], type: 'title' | 'border' | 'theme', owned: string[], equipped: string) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(item => {
        const isOwned = owned.includes(item.id);
        const isEquipped = equipped === item.id;
        
        return (
          <div
            key={item.id}
            className={`p-4 rounded-xl border-2 transition-all ${getRarityColor(item.rarity)} ${getRarityBg(item.rarity)} ${
              isEquipped ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="text-4xl text-center mb-3">{item.preview}</div>
            <p className="font-display font-bold text-center text-sm mb-1">{item.name}</p>
            <p className="text-xs text-center text-muted-foreground capitalize mb-3">{item.rarity}</p>
            
            {isOwned ? (
              <Button
                variant={isEquipped ? 'gaming' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => equipItem(type, item.id)}
              >
                {isEquipped ? <Check className="w-4 h-4 mr-1" /> : null}
                {isEquipped ? 'Equipped' : 'Equip'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => purchaseItem(type, item)}
                disabled={!!item.requirement}
              >
                {item.requirement ? (
                  <Lock className="w-4 h-4 mr-1" />
                ) : item.coinCost > 0 ? (
                  <>
                    <Coins className="w-4 h-4 mr-1 text-warning" />
                    {item.coinCost}
                  </>
                ) : item.gemCost > 0 ? (
                  <>
                    <Gem className="w-4 h-4 mr-1 text-secondary" />
                    {item.gemCost}
                  </>
                ) : (
                  'Free'
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Log in to customize your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted border border-border">
        <h3 className="font-display font-bold mb-4">Preview</h3>
        <div className="flex items-center gap-4">
          <div className={`relative p-1 rounded-full ${
            equippedBorder === 'default' ? 'bg-border' :
            equippedBorder === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
            equippedBorder === 'diamond' ? 'bg-gradient-to-r from-cyan-400 to-blue-500' :
            equippedBorder === 'rainbow' ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500' :
            equippedBorder === 'animated-fire' ? 'bg-gradient-to-r from-orange-500 to-red-600 animate-pulse' :
            equippedBorder === 'animated-cosmic' ? 'bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse' :
            'bg-border'
          }`}>
            <img
              src={user?.avatar}
              alt="Preview"
              className="w-16 h-16 rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg">{user?.username}</span>
              <span className="text-lg">{TITLES.find(t => t.id === equippedTitle)?.preview}</span>
            </div>
            <p className="text-sm text-muted-foreground">{TITLES.find(t => t.id === equippedTitle)?.name}</p>
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
          <Coins className="w-5 h-5 text-warning" />
          <span className="font-bold">{coins.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
          <Gem className="w-5 h-5 text-secondary" />
          <span className="font-bold">{gems.toLocaleString()}</span>
        </div>
      </div>

      <Tabs defaultValue="titles">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="titles" className="gap-2">
            <Crown className="w-4 h-4" />
            Titles
          </TabsTrigger>
          <TabsTrigger value="borders" className="gap-2">
            <Frame className="w-4 h-4" />
            Borders
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="w-4 h-4" />
            Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="titles" className="mt-6">
          {renderItems(TITLES, 'title', ownedTitles, equippedTitle)}
        </TabsContent>

        <TabsContent value="borders" className="mt-6">
          {renderItems(BORDERS, 'border', ownedBorders, equippedBorder)}
        </TabsContent>

        <TabsContent value="themes" className="mt-6">
          {renderItems(THEMES, 'theme', ownedThemes, equippedTheme)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileCustomization;

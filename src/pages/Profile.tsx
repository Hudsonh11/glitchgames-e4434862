import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Trophy, Gamepad2, Clock, Calendar, Award, Users, Share2, Swords, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import ProfileShop from '@/components/ProfileShop';
import ProfileCustomization from '@/components/ProfileCustomization';
import FriendSystem from '@/components/FriendSystem';
import RankedSystem from '@/components/RankedSystem';
import ChallengeSystem from '@/components/ChallengeSystem';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import UltraParticles from '@/components/UltraParticles';
import UltraCard from '@/components/UltraCard';
import UltraXPBar from '@/components/UltraXPBar';
import UltraAvatar from '@/components/UltraAvatar';
import UltraBadge from '@/components/UltraBadge';
import UltraGameStats from '@/components/UltraGameStats';
import UltraLoadingSpinner from '@/components/UltraLoadingSpinner';

const achievementsList = [
  { id: 'block_combo_5', name: 'Combo Master', description: 'Clear 5+ blocks at once', icon: '🎯', rarity: 'rare' as const },
  { id: 'block_score_1000', name: 'Block Legend', description: 'Score 1000+ in Block Blast', icon: '💎', rarity: 'legendary' as const },
  { id: 'clicker_100', name: 'First Steps', description: 'Reach 100 clicks', icon: '👆', rarity: 'common' as const },
  { id: 'clicker_1000', name: 'Click Champion', description: 'Reach 1000 clicks', icon: '🏆', rarity: 'rare' as const },
];

const Profile: React.FC = () => {
  const { user, isLoggedIn, isLoading, achievements, gameStats, coins, gems, currentStreak } = useGame();
  const { toast } = useToast();
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`purchased_items_${user?.id}`);
    if (saved) setPurchasedItems(JSON.parse(saved));
  }, [user?.id]);

  const handlePurchase = (itemId: string) => {
    const newItems = [...purchasedItems, itemId];
    setPurchasedItems(newItems);
    localStorage.setItem(`purchased_items_${user?.id}`, JSON.stringify(newItems));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <UltraLoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" />;

  const xpToNextLevel = (user?.level || 1) * 100;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${user?.username}`);
    toast({ title: 'Link Copied!', description: 'Share with friends to invite them.' });
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <UltraParticles count={15} />
      
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <UltraCard variant="premium" glow className="mb-8 overflow-visible">
            <div className="h-32 rounded-t-2xl bg-gradient-hero relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16 md:-mt-12">
                <UltraAvatar src={user?.avatar || ''} size="xl" level={user?.level || 1} border="rainbow" status="online" />
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h1 className="font-display text-2xl font-bold">{user?.username}</h1>
                    <UltraBadge variant="premium" size="sm" icon="star">Level {user?.level}</UltraBadge>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mt-1">
                    <Sparkles className="w-4 h-4 text-primary" /> Premium Player
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2" onClick={copyInviteLink}>
                    <Share2 className="w-4 h-4" /> Invite
                  </Button>
                  <Link to="/settings"><Button variant="gaming">Edit Profile</Button></Link>
                </div>
              </div>
              <div className="mt-6">
                <UltraXPBar currentXP={user?.xp || 0} maxXP={xpToNextLevel} level={user?.level || 1} />
              </div>
            </div>
          </UltraCard>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Trophy, label: 'Total Score', value: user?.totalScore?.toLocaleString() || '0', color: 'text-warning' },
              { icon: Gamepad2, label: 'Games Played', value: user?.gamesPlayed || 0, color: 'text-primary' },
              { icon: Award, label: 'Achievements', value: achievements.length, color: 'text-success' },
              { icon: TrendingUp, label: 'Day Streak', value: `${currentStreak}🔥`, color: 'text-secondary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <UltraCard key={label} variant="glass" className="p-4">
                <Icon className={`w-6 h-6 ${color} mb-2`} />
                <p className="text-2xl font-display font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </UltraCard>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <UltraCard variant="glass" className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center"><span className="text-2xl">🪙</span></div>
              <div><p className="text-sm text-muted-foreground">Coins</p><p className="font-display text-2xl font-bold text-warning">{coins.toLocaleString()}</p></div>
            </UltraCard>
            <UltraCard variant="glass" className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center"><span className="text-2xl">💎</span></div>
              <div><p className="text-sm text-muted-foreground">Gems</p><p className="font-display text-2xl font-bold text-secondary">{gems.toLocaleString()}</p></div>
            </UltraCard>
          </div>

          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 bg-card/50 backdrop-blur">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="friends"><Users className="w-3 h-3 mr-1" />Friends</TabsTrigger>
              <TabsTrigger value="ranked"><Swords className="w-3 h-3 mr-1" />Ranked</TabsTrigger>
              <TabsTrigger value="challenges"><Trophy className="w-3 h-3 mr-1" />Challenges</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" /> Game Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(gameStats).map(([gameId, stats]) => (
                  <UltraGameStats key={gameId} gameName={gameId} highScore={stats.highScore} gamesPlayed={stats.gamesPlayed} timePlayed={stats.timePlayed} trending={stats.gamesPlayed > 10} />
                ))}
                {Object.keys(gameStats).length === 0 && (
                  <UltraCard variant="glass" className="col-span-2 p-8 text-center">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No games played yet!</p>
                  </UltraCard>
                )}
              </div>
            </TabsContent>
            <TabsContent value="friends" className="mt-6"><FriendSystem /></TabsContent>
            <TabsContent value="ranked" className="mt-6"><RankedSystem /></TabsContent>
            <TabsContent value="challenges" className="mt-6"><ChallengeSystem /></TabsContent>
            <TabsContent value="customize" className="mt-6"><ProfileCustomization /></TabsContent>
            <TabsContent value="shop" className="mt-6"><ProfileShop purchasedItems={purchasedItems} onPurchase={handlePurchase} /></TabsContent>
            <TabsContent value="achievements" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {achievementsList.map((achievement) => {
                  const isUnlocked = achievements.includes(achievement.id);
                  return (
                    <UltraCard key={achievement.id} variant={isUnlocked ? 'premium' : 'default'} glow={isUnlocked} className={`p-4 ${!isUnlocked ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-display font-bold">{achievement.name}</h3>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          <UltraBadge variant={achievement.rarity} size="sm">{achievement.rarity}</UltraBadge>
                        </div>
                      </div>
                    </UltraCard>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <UltraCard variant="glass" className="p-6">
            <h2 className="font-display text-xl font-bold mb-4">Account Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Member Since</p><p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{new Date(user?.joinDate || '').toLocaleDateString()}</p></div>
              <div><p className="text-muted-foreground">Last Login</p><p className="font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-success" />{new Date(user?.lastLogin || '').toLocaleDateString()}</p></div>
            </div>
          </UltraCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;

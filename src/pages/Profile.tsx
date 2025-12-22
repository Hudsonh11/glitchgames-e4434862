import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, Trophy, Gamepad2, Clock, Calendar, Award, Users, Share2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import ProfileShop from '@/components/ProfileShop';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const achievementsList = [
  { id: 'block_combo_5', name: 'Combo Master', description: 'Clear 5+ blocks at once', icon: '🎯' },
  { id: 'block_score_1000', name: 'Block Legend', description: 'Score 1000+ in Block Blast', icon: '💎' },
  { id: 'clicker_100', name: 'First Steps', description: 'Reach 100 clicks', icon: '👆' },
  { id: 'clicker_1000', name: 'Click Champion', description: 'Reach 1000 clicks', icon: '🏆' },
  { id: 'clicker_10000', name: 'Click God', description: 'Reach 10000 clicks', icon: '⚡' },
  { id: 'gdash_50', name: 'Survivor', description: 'Score 50+ in Geometry Dash', icon: '🏃' },
  { id: 'gdash_100', name: 'Dash Master', description: 'Score 100+ in Geometry Dash', icon: '🌟' },
  { id: 'racing_100', name: 'Speed Demon', description: 'Score 100+ in Racing', icon: '🚗' },
  { id: 'racing_500', name: 'Road Warrior', description: 'Score 500+ in Racing', icon: '🏎️' },
];

const Profile: React.FC = () => {
  const { user, isLoggedIn, achievements, gameStats, coins, gems } = useGame();
  const { toast } = useToast();
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);

  useEffect(() => {
    // Load purchased items from localStorage for now
    const saved = localStorage.getItem(`purchased_items_${user?.id}`);
    if (saved) {
      setPurchasedItems(JSON.parse(saved));
    }
  }, [user?.id]);

  const handlePurchase = (itemId: string) => {
    const newItems = [...purchasedItems, itemId];
    setPurchasedItems(newItems);
    localStorage.setItem(`purchased_items_${user?.id}`, JSON.stringify(newItems));
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const xpToNextLevel = (user?.level || 1) * 100;
  const currentXpProgress = ((user?.xp || 0) / xpToNextLevel) * 100;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${user?.username}`);
    toast({
      title: 'Link Copied!',
      description: 'Share this link with friends to invite them.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Profile Header */}
          <div className="relative mb-8">
            <div className="h-32 rounded-t-2xl bg-gradient-hero" />
            <div className="p-6 rounded-b-2xl bg-card border border-border border-t-0">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16 md:-mt-12">
                <img
                  src={user?.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl border-4 border-card shadow-lg"
                />
                <div className="text-center md:text-left flex-1">
                  <h1 className="font-display text-2xl font-bold">{user?.username}</h1>
                  <p className="text-muted-foreground">Level {user?.level} Player</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2" onClick={copyInviteLink}>
                    <Share2 className="w-4 h-4" />
                    Invite Friends
                  </Button>
                  <Link to="/settings">
                    <Button variant="gaming">Edit Profile</Button>
                  </Link>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Level {user?.level}</span>
                  <span className="text-primary">{user?.xp} / {xpToNextLevel} XP</span>
                </div>
                <Progress value={currentXpProgress} className="h-3" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Trophy, label: 'Total Score', value: user?.totalScore?.toLocaleString() || '0', color: 'text-warning' },
              { icon: Gamepad2, label: 'Games Played', value: user?.gamesPlayed || 0, color: 'text-primary' },
              { icon: Award, label: 'Achievements', value: achievements.length, color: 'text-success' },
              { icon: Users, label: 'Friends', value: user?.friends?.length || 0, color: 'text-secondary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="p-4 rounded-xl bg-card border border-border">
                <Icon className={`w-6 h-6 ${color} mb-2`} />
                <p className="text-2xl font-display font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs for Profile Sections */}
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-8">
              {/* Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-card border border-border flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center">
                    <span className="text-2xl">🪙</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coins</p>
                    <p className="font-display text-2xl font-bold text-warning">{coins.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gems</p>
                    <p className="font-display text-2xl font-bold text-secondary">{gems.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Game Stats */}
              <div>
                <h2 className="font-display text-xl font-bold mb-4">Game Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(gameStats).map(([gameId, stats]) => (
                    <div key={gameId} className="p-4 rounded-xl bg-card border border-border">
                      <h3 className="font-display font-bold capitalize mb-3">{gameId.replace('-', ' ')}</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xl font-bold text-primary">{stats.highScore}</p>
                          <p className="text-xs text-muted-foreground">High Score</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-success">{stats.gamesPlayed}</p>
                          <p className="text-xs text-muted-foreground">Games</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-warning">{Math.floor(stats.timePlayed / 60)}m</p>
                          <p className="text-xs text-muted-foreground">Time</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(gameStats).length === 0 && (
                    <p className="col-span-2 text-center text-muted-foreground py-8">
                      No games played yet. Start playing to see your stats!
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shop" className="mt-6">
              <ProfileShop purchasedItems={purchasedItems} onPurchase={handlePurchase} />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {achievementsList.map((achievement) => {
                  const isUnlocked = achievements.includes(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isUnlocked
                          ? 'bg-card border-primary/50 shadow-neon-cyan'
                          : 'bg-muted/30 border-border opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-display font-bold">{achievement.name}</h3>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Account Info */}
          <div className="mt-8 p-6 rounded-xl bg-card border border-border">
            <h2 className="font-display text-xl font-bold mb-4">Account Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Member Since</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(user?.joinDate || '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Login</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(user?.lastLogin || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Clock, Check, X, Coins, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerAvatar: string;
  challengedId: string;
  challengedName: string;
  challengedAvatar: string;
  gameId: string;
  gameName: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  challengerScore?: number;
  challengedScore?: number;
  winnerId?: string;
  wagerCoins: number;
  createdAt: string;
}

const GAMES = [
  { id: 'tetris', name: 'Tetris' },
  { id: 'snake', name: 'Snake' },
  { id: '2048', name: '2048' },
  { id: 'flappy', name: 'Flappy Bird' },
  { id: 'geometry-dash', name: 'Geometry Dash' },
];

const ChallengeSystem: React.FC = () => {
  const { user, isLoggedIn, coins, spendCoins, addCoins } = useGame();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [friends, setFriends] = useState<{ id: string; username: string; avatar: string }[]>([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [wagerAmount, setWagerAmount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchChallenges();
      fetchFriends();
      setupRealtime();
    }
  }, [isLoggedIn, user]);

  const setupRealtime = () => {
    const channel = supabase
      .channel('challenges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges'
      }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchChallenges = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('challenges')
      .select('*')
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch user profiles for challenges
      const userIds = [...new Set(data.flatMap(c => [c.challenger_id, c.challenged_id]))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const challengeList: Challenge[] = data.map(c => {
        const challenger = profiles?.find(p => p.user_id === c.challenger_id);
        const challenged = profiles?.find(p => p.user_id === c.challenged_id);
        const game = GAMES.find(g => g.id === c.game_id);
        
        return {
          id: c.id,
          challengerId: c.challenger_id,
          challengerName: challenger?.username || 'Unknown',
          challengerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${challenger?.username}`,
          challengedId: c.challenged_id,
          challengedName: challenged?.username || 'Unknown',
          challengedAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${challenged?.username}`,
          gameId: c.game_id,
          gameName: game?.name || c.game_id,
          status: c.status as any,
          challengerScore: c.challenger_score,
          challengedScore: c.challenged_score,
          winnerId: c.winner_id,
          wagerCoins: c.wager_coins,
          createdAt: c.created_at
        };
      });
      setChallenges(challengeList);
    }
  };

  const fetchFriends = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (data) {
      const friendIds = data.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', friendIds);

      if (profiles) {
        setFriends(profiles.map(p => ({
          id: p.user_id,
          username: p.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`
        })));
      }
    }
  };

  const createChallenge = async () => {
    if (!user || !selectedFriend || !selectedGame) return;

    if (wagerAmount > 0 && wagerAmount > coins) {
      toast({
        title: 'Not enough coins',
        description: 'You don\'t have enough coins for this wager',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);

    if (wagerAmount > 0) {
      await spendCoins(wagerAmount);
    }

    const { error } = await supabase
      .from('challenges')
      .insert({
        challenger_id: user.id,
        challenged_id: selectedFriend,
        game_id: selectedGame,
        wager_coins: wagerAmount
      });

    if (error) {
      if (wagerAmount > 0) {
        await addCoins(wagerAmount);
      }
      toast({
        title: 'Error',
        description: 'Could not create challenge',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Challenge Sent!',
        description: 'Waiting for your friend to accept'
      });
      setSelectedFriend('');
      setSelectedGame('');
      setWagerAmount(0);
    }

    setIsCreating(false);
  };

  const respondToChallenge = async (challengeId: string, accept: boolean) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !user) return;

    if (accept && challenge.wagerCoins > coins) {
      toast({
        title: 'Not enough coins',
        description: 'You need more coins to accept this challenge',
        variant: 'destructive'
      });
      return;
    }

    if (accept && challenge.wagerCoins > 0) {
      await spendCoins(challenge.wagerCoins);
    }

    const { error } = await supabase
      .from('challenges')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', challengeId);

    if (!error) {
      toast({
        title: accept ? 'Challenge Accepted!' : 'Challenge Declined',
        description: accept ? 'Go play the game and set your high score!' : ''
      });
    }
  };

  const pendingChallenges = challenges.filter(c => c.status === 'pending' && c.challengedId === user?.id);
  const activeChallenges = challenges.filter(c => c.status === 'accepted');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <Swords className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Log in to challenge friends</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Challenge */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="gaming" className="w-full gap-2">
            <Swords className="w-5 h-5" />
            Challenge a Friend
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Select Friend</label>
              <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a friend" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map(friend => (
                    <SelectItem key={friend.id} value={friend.id}>
                      <div className="flex items-center gap-2">
                        <img src={friend.avatar} alt="" className="w-6 h-6 rounded-full" />
                        {friend.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Select Game</label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent>
                  {GAMES.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Wager (Optional)</label>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-warning" />
                <Input
                  type="number"
                  min={0}
                  max={coins}
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(Math.min(coins, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Your balance: {coins} coins</p>
            </div>

            <Button 
              variant="gaming" 
              className="w-full"
              onClick={createChallenge}
              disabled={!selectedFriend || !selectedGame || isCreating}
            >
              Send Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Target className="w-4 h-4" />
            Active ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Trophy className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingChallenges.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No pending challenges</p>
            </div>
          ) : (
            pendingChallenges.map(challenge => (
              <div key={challenge.id} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <img src={challenge.challengerAvatar} alt="" className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <p className="font-display font-bold">{challenge.challengerName}</p>
                    <p className="text-sm text-muted-foreground">challenges you to {challenge.gameName}</p>
                  </div>
                  {challenge.wagerCoins > 0 && (
                    <div className="flex items-center gap-1 text-warning">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{challenge.wagerCoins}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="gaming" className="flex-1" onClick={() => respondToChallenge(challenge.id, true)}>
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => respondToChallenge(challenge.id, false)}>
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6 space-y-4">
          {activeChallenges.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No active challenges</p>
            </div>
          ) : (
            activeChallenges.map(challenge => (
              <div key={challenge.id} className="p-4 rounded-xl bg-card border border-primary/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={challenge.challengerAvatar} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-bold">{challenge.challengerName}</span>
                  </div>
                  <span className="text-2xl">⚔️</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{challenge.challengedName}</span>
                    <img src={challenge.challengedAvatar} alt="" className="w-10 h-10 rounded-full" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Playing: {challenge.gameName}</p>
                  {challenge.wagerCoins > 0 && (
                    <p className="text-warning font-bold mt-1">
                      Prize Pool: {challenge.wagerCoins * 2} coins
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedChallenges.slice(0, 10).map(challenge => (
            <div key={challenge.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={challenge.challengerAvatar} alt="" className="w-8 h-8 rounded-full" />
                  <div>
                    <span className="font-medium">{challenge.challengerName}</span>
                    <span className="text-muted-foreground mx-2">vs</span>
                    <span className="font-medium">{challenge.challengedName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{challenge.gameName}</p>
                  {challenge.winnerId && (
                    <p className={`font-bold ${challenge.winnerId === user?.id ? 'text-success' : 'text-destructive'}`}>
                      {challenge.winnerId === user?.id ? 'Won' : 'Lost'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChallengeSystem;

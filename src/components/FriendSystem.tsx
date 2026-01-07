import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, MessageSquare, Users, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in_game' | 'away';
  currentGame?: string;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

const FriendSystem: React.FC = () => {
  const { user, isLoggedIn } = useGame();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; avatar: string }[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchFriends();
      fetchPendingRequests();
      setupRealtimeSubscription();
    }
  }, [isLoggedIn, user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('friend-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships'
      }, () => {
        fetchFriends();
        fetchPendingRequests();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (selectedFriend && (payload.new as any).sender_id === selectedFriend.id) {
          setMessages(prev => [...prev, {
            id: (payload.new as any).id,
            senderId: (payload.new as any).sender_id,
            content: (payload.new as any).content,
            createdAt: (payload.new as any).created_at,
            read: false
          }]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      const { data: statuses } = await supabase
        .from('player_status')
        .select('user_id, status, current_game')
        .in('user_id', friendIds);

      if (profiles) {
        const friendsList: Friend[] = profiles.map(p => {
          const status = statuses?.find(s => s.user_id === p.user_id);
          return {
            id: p.user_id,
            username: p.username,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
            status: (status?.status as any) || 'offline',
            currentGame: status?.current_game || undefined
          };
        });
        setFriends(friendsList);
      }
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('id, sender_id, created_at')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (data) {
      const senderIds = data.map(r => r.sender_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', senderIds);

      const requests: FriendRequest[] = data.map(r => {
        const profile = profiles?.find(p => p.user_id === r.sender_id);
        return {
          id: r.id,
          senderId: r.sender_id,
          senderUsername: profile?.username || 'Unknown',
          senderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'unknown'}`,
          createdAt: r.created_at
        };
      });
      setPendingRequests(requests);
    }
  };

  const searchPlayers = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username')
      .ilike('username', `%${searchQuery}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (data) {
      setSearchResults(data.map(p => ({
        id: p.user_id,
        username: p.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`
      })));
    }
    setIsLoading(false);
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not send friend request',
        variant: 'destructive'
      });
    } else {
      setSentRequests(prev => [...prev, receiverId]);
      toast({
        title: 'Request Sent!',
        description: 'Friend request sent successfully'
      });
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    const newStatus = accept ? 'accepted' : 'declined';
    
    const { error } = await supabase
      .from('friendships')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      if (accept) {
        fetchFriends();
        toast({
          title: 'Friend Added!',
          description: 'You are now friends'
        });
      }
    }
  };

  const openChat = async (friend: Friend) => {
    setSelectedFriend(friend);
    
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
        read: m.read
      })));

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', friend.id)
        .eq('receiver_id', user.id)
        .eq('read', false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !user || !selectedFriend) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content: messageInput.trim()
      });

    if (!error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        senderId: user.id,
        content: messageInput.trim(),
        createdAt: new Date().toISOString(),
        read: false
      }]);
      setMessageInput('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'in_game': return 'bg-primary';
      case 'away': return 'bg-warning';
      default: return 'bg-muted-foreground';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Log in to manage friends</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="gap-2">
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="w-4 h-4" />
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="w-4 h-4" />
            Add Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No friends yet. Search for players to add!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="relative">
                    <img src={friend.avatar} alt={friend.username} className="w-12 h-12 rounded-full" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(friend.status)}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold">{friend.username}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {friend.status === 'in_game' && friend.currentGame 
                        ? `Playing ${friend.currentGame}` 
                        : friend.status}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openChat(friend)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <img src={request.senderAvatar} alt={request.senderUsername} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <p className="font-display font-bold">{request.senderUsername}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="gaming" size="sm" onClick={() => respondToRequest(request.id, true)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => respondToRequest(request.id, false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
              className="flex-1"
            />
            <Button variant="gaming" onClick={searchPlayers} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map(player => {
                const isFriend = friends.some(f => f.id === player.id);
                const isPending = sentRequests.includes(player.id);
                
                return (
                  <div key={player.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                    <img src={player.avatar} alt={player.username} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <p className="font-display font-bold">{player.username}</p>
                    </div>
                    {isFriend ? (
                      <Button variant="outline" size="sm" disabled>
                        <Check className="w-4 h-4 mr-2" />
                        Friends
                      </Button>
                    ) : isPending ? (
                      <Button variant="outline" size="sm" disabled>
                        <Clock className="w-4 h-4 mr-2" />
                        Pending
                      </Button>
                    ) : (
                      <Button variant="gaming" size="sm" onClick={() => sendFriendRequest(player.id)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFriend && (
                <>
                  <div className="relative">
                    <img src={selectedFriend.avatar} alt={selectedFriend.username} className="w-10 h-10 rounded-full" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${getStatusColor(selectedFriend.status)}`} />
                  </div>
                  <span>{selectedFriend.username}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.senderId === user?.id
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-3 mt-4">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button variant="gaming" onClick={sendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FriendSystem;

import React, { useState, useEffect } from 'react';
import { Trophy, UserPlus, Gamepad2, Star, Flame, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  activityType: string;
  content: string;
  relatedUsername?: string;
  gameId?: string;
  createdAt: string;
}

const ActivityFeed: React.FC = () => {
  const { user, isLoggedIn } = useGame();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    setupRealtime();
  }, []);

  const setupRealtime = () => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed'
      }, (payload) => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const activityList: Activity[] = data.map(a => {
        const profile = profiles?.find(p => p.user_id === a.user_id);
        return {
          id: a.id,
          userId: a.user_id,
          username: profile?.username || 'Unknown',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'unknown'}`,
          activityType: a.activity_type,
          content: a.content,
          gameId: a.game_id,
          createdAt: a.created_at
        };
      });
      setActivities(activityList);
    }
    setIsLoading(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'high_score': return <Trophy className="w-5 h-5 text-warning" />;
      case 'friend_added': return <UserPlus className="w-5 h-5 text-success" />;
      case 'game_played': return <Gamepad2 className="w-5 h-5 text-primary" />;
      case 'achievement': return <Star className="w-5 h-5 text-secondary" />;
      case 'level_up': return <Flame className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Activity Feed
        </h3>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <img src={activity.avatar} alt={activity.username} className="w-10 h-10 rounded-full" />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-card">
                    {getActivityIcon(activity.activityType)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-bold">{activity.username}</span>{' '}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityFeed;

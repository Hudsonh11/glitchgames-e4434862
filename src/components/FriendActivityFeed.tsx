import React from 'react';
import { Trophy, Gamepad2, Star, Medal, UserPlus, Clock, MessageCircle } from 'lucide-react';
import UltraCard from './UltraCard';
import UltraAvatar from './UltraAvatar';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  type: 'high_score' | 'achievement' | 'level_up' | 'playing' | 'joined';
  content: string;
  gameId?: string;
  gameName?: string;
  timestamp: Date;
  score?: number;
}

interface FriendActivityFeedProps {
  activities?: Activity[];
  onViewProfile?: (userId: string) => void;
  onChallenge?: (userId: string) => void;
}

const FriendActivityFeed: React.FC<FriendActivityFeedProps> = ({
  activities = defaultActivities,
  onViewProfile,
  onChallenge,
}) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'high_score': return <Trophy className="w-4 h-4 text-warning" />;
      case 'achievement': return <Medal className="w-4 h-4 text-primary" />;
      case 'level_up': return <Star className="w-4 h-4 text-secondary" />;
      case 'playing': return <Gamepad2 className="w-4 h-4 text-success" />;
      case 'joined': return <UserPlus className="w-4 h-4 text-info" />;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <UltraCard variant="glass" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-success/20 text-success">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Friend Activity</h3>
            <p className="text-sm text-muted-foreground">See what your friends are up to</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="relative flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 group animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Avatar */}
            <UltraAvatar
              src={activity.avatar}
              size="sm"
              level={activity.level}
              status={activity.type === 'playing' ? 'online' : 'offline'}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="font-semibold hover:text-primary cursor-pointer transition-colors"
                  onClick={() => onViewProfile?.(activity.userId)}
                >
                  {activity.username}
                </span>
                <span className="text-muted-foreground text-sm">{activity.content}</span>
              </div>
              
              {activity.gameName && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    {activity.gameName}
                  </span>
                  {activity.score && (
                    <span className="text-xs text-warning font-bold">
                      {activity.score.toLocaleString()} pts
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {getTimeAgo(activity.timestamp)}
              </div>
            </div>

            {/* Action Icon */}
            <div className="flex items-center gap-2">
              {getActivityIcon(activity.type)}
              
              {activity.type === 'playing' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onChallenge?.(activity.userId)}
                >
                  Challenge
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <Button variant="ghost" className="w-full mt-4">
        View All Activity
      </Button>
    </UltraCard>
  );
};

const defaultActivities: Activity[] = [
  {
    id: '1',
    userId: 'user1',
    username: 'ProGamer99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer99',
    level: 42,
    type: 'high_score',
    content: 'set a new high score!',
    gameName: 'Tetris',
    score: 125000,
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: '2',
    userId: 'user2',
    username: 'SpeedRunner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SpeedRunner',
    level: 35,
    type: 'playing',
    content: 'is currently playing',
    gameName: 'Geometry Dash',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '3',
    userId: 'user3',
    username: 'CasualKing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CasualKing',
    level: 28,
    type: 'achievement',
    content: 'unlocked "Speed Demon"',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: '4',
    userId: 'user4',
    username: 'NoobMaster',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NoobMaster',
    level: 15,
    type: 'level_up',
    content: 'reached Level 15!',
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: '5',
    userId: 'user5',
    username: 'GamerGirl',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GamerGirl',
    level: 50,
    type: 'high_score',
    content: 'dominated the leaderboard!',
    gameName: 'Snake',
    score: 89500,
    timestamp: new Date(Date.now() - 3600000),
  },
];

export default FriendActivityFeed;

import React from 'react';
import { Sparkles, Trophy, Flame, Gift, ArrowRight, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraAvatar from '@/components/UltraAvatar';
import UltraBadge from '@/components/UltraBadge';
import { formatDistanceToNow } from 'date-fns';

interface WelcomeBackProps {
  username: string;
  avatar?: string;
  level: number;
  streak: number;
  lastPlayed?: { gameId: string; gameName: string; score: number };
  hasReward: boolean;
}

const WelcomeBack: React.FC<WelcomeBackProps> = ({
  username,
  avatar,
  level,
  streak,
  lastPlayed,
  hasReward,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <UltraCard variant="premium" glow className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--primary)) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, hsl(var(--secondary)) 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: User Info */}
          <div className="flex items-center gap-4">
            <UltraAvatar src={avatar || ''} size="lg" level={level} status="online" border="rainbow" />
            <div>
              <p className="text-muted-foreground text-sm">{getGreeting()},</p>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                {username}
                <Sparkles className="w-5 h-5 text-warning animate-pulse" />
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <UltraBadge variant="premium" size="sm" icon="star">
                  Level {level}
                </UltraBadge>
                {streak > 0 && (
                  <div className="flex items-center gap-1 text-warning">
                    <Flame className="w-4 h-4 fill-warning" />
                    <span className="text-sm font-bold">{streak} day streak</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {hasReward && (
              <Button variant="outline" size="sm" asChild className="border-success/50 hover:bg-success/10">
                <Link to="/rewards">
                  <Gift className="w-4 h-4 mr-2 text-success" />
                  Claim Reward
                </Link>
              </Button>
            )}
            {lastPlayed && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/game/${lastPlayed.gameId}`}>
                  <Zap className="w-4 h-4 mr-2" />
                  Continue {lastPlayed.gameName}
                </Link>
              </Button>
            )}
            <Button variant="gaming" size="sm" asChild>
              <Link to="/#games">
                Play Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-warning" />
              <span className="font-display font-bold text-lg">
                {lastPlayed?.score?.toLocaleString() || '0'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Last Score</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-lg">{level}</span>
            </div>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-error" />
              <span className="font-display font-bold text-lg">{streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </div>
    </UltraCard>
  );
};

export default WelcomeBack;

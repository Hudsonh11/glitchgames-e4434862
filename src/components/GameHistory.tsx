import React from 'react';
import { Clock, Trophy, Gamepad2, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import { formatDistanceToNow } from 'date-fns';

interface GameSession {
  gameId: string;
  gameName: string;
  score: number;
  playedAt: Date;
  duration: number;
}

interface GameHistoryProps {
  sessions: GameSession[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <UltraCard variant="glass" className="p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-lg font-bold mb-2">No Game History</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Start playing games to see your history here!
        </p>
        <Button variant="outline" asChild>
          <Link to="/">Play Now</Link>
        </Button>
      </UltraCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Games
        </h3>
        <span className="text-sm text-muted-foreground">{sessions.length} sessions</span>
      </div>
      
      <div className="space-y-3">
        {sessions.slice(0, 10).map((session, index) => (
          <UltraCard 
            key={`${session.gameId}-${index}`} 
            variant="glass" 
            className="p-4 animate-fade-in-up hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display font-bold">{session.gameName}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(session.playedAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-warning">
                    <Trophy className="w-4 h-4" />
                    <span className="font-display font-bold">{session.score.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{Math.floor(session.duration / 60)}m played</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/game/${session.gameId}`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Play
                  </Link>
                </Button>
              </div>
            </div>
          </UltraCard>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;

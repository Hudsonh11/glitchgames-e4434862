import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Globe } from 'lucide-react';

interface LivePlayerCountProps {
  compact?: boolean;
}

const LivePlayerCount: React.FC<LivePlayerCountProps> = ({ compact = false }) => {
  const [playerCount, setPlayerCount] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    // Simulate live player count with realistic fluctuations
    const baseCount = 1247;
    const updateCount = () => {
      const fluctuation = Math.floor(Math.random() * 100) - 50;
      const newCount = Math.max(800, baseCount + fluctuation);
      
      setTrend(newCount > playerCount ? 'up' : newCount < playerCount ? 'down' : 'stable');
      setPlayerCount(newCount);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, [playerCount]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel">
        <div className="relative">
          <Users className="w-4 h-4 text-success" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-ping" />
        </div>
        <span className="text-sm font-bold text-foreground">{playerCount.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">online</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-success" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Players Online</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground animate-counter-pop">
                {playerCount.toLocaleString()}
              </span>
              {trend === 'up' && (
                <TrendingUp className="w-4 h-4 text-success animate-bounce" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-success text-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-ping" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePlayerCount;

import React from 'react';
import { Trophy, Star, Coins, Gem, Share2, RotateCcw, Home, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import UltraConfetti from '@/components/UltraConfetti';

interface GameCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  coinsEarned: number;
  xpEarned: number;
  onPlayAgain: () => void;
}

const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  isOpen,
  onClose,
  gameName,
  score,
  highScore,
  isNewHighScore,
  coinsEarned,
  xpEarned,
  onPlayAgain,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <UltraConfetti active={isNewHighScore} />
      <UltraCard variant="premium" glow className="p-8 max-w-md w-full mx-4 text-center">
        {isNewHighScore && (
          <div className="mb-4">
            <UltraBadge variant="legendary" size="lg" animated icon="trophy">
              New High Score!
            </UltraBadge>
          </div>
        )}
        
        <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h2 className="font-display text-3xl font-bold mb-2">Game Over!</h2>
        <p className="text-muted-foreground mb-6">{gameName}</p>
        
        <div className="text-5xl font-display font-black text-gradient mb-2">
          {score.toLocaleString()}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Best: {highScore.toLocaleString()}
        </p>
        
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-display font-bold text-warning">+{coinsEarned}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-primary">+{xpEarned} XP</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/leaderboard">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ranks
            </Link>
          </Button>
          <Button variant="gaming" className="flex-1" onClick={onPlayAgain}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </UltraCard>
    </div>
  );
};

export default GameCompletionModal;

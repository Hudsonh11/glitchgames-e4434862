import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Copy, Check, Download, Trophy, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ShareScoreModalProps {
  score: number;
  gameName: string;
  rank?: number;
  isNewHighScore?: boolean;
  username: string;
  trigger?: React.ReactNode;
}

const ShareScoreModal: React.FC<ShareScoreModalProps> = ({
  score,
  gameName,
  rank,
  isNewHighScore = false,
  username,
  trigger,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareText = isNewHighScore
    ? `🎮 NEW HIGH SCORE! I just scored ${score.toLocaleString()} points in ${gameName} on Glitch Games! Can you beat me? 🏆`
    : `🎮 I scored ${score.toLocaleString()} points in ${gameName} on Glitch Games! ${rank ? `Rank #${rank} 🏆` : ''} Play now!`;

  const shareUrl = window.location.origin;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Score
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Score
          </DialogTitle>
        </DialogHeader>

        {/* Score Preview Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/30 p-6 my-4">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/50 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/50 rounded-full blur-3xl" />
          </div>

          {/* Sparkle Effects */}
          {isNewHighScore && (
            <div className="absolute top-2 right-2">
              <Sparkles className="w-6 h-6 text-warning animate-pulse" />
            </div>
          )}

          <div className="relative text-center">
            {/* High Score Badge */}
            {isNewHighScore && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-bold mb-3 animate-bounce">
                <Star className="w-4 h-4 fill-warning" />
                NEW HIGH SCORE!
              </div>
            )}

            {/* Game & User */}
            <p className="text-sm text-muted-foreground mb-1">{username}</p>
            <h3 className="font-display text-lg font-bold text-primary mb-3">{gameName}</h3>

            {/* Score */}
            <div className="relative">
              <p className="font-display text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-shimmer">
                {score.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">points</p>
            </div>

            {/* Rank */}
            {rank && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10">
                <Trophy className="w-5 h-5 text-warning" />
                <span className="font-bold">Rank #{rank}</span>
              </div>
            )}
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Share to:</p>
          
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex-col gap-2 h-auto py-4 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2] hover:text-[#1DA1F2]"
              onClick={handleTwitterShare}
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs">Twitter</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col gap-2 h-auto py-4 hover:bg-[#4267B2]/10 hover:border-[#4267B2] hover:text-[#4267B2]"
              onClick={handleFacebookShare}
            >
              <Facebook className="w-5 h-5" />
              <span className="text-xs">Facebook</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-xs text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="text-xs">Copy Link</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Text */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground">{shareText}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareScoreModal;

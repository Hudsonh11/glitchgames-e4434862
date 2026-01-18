import React, { useState } from 'react';
import { Share2, Copy, Check, Twitter, Facebook, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  title: string;
  score?: number;
  gameId?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ title, score, gameId }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = gameId 
    ? `${window.location.origin}/game/${gameId}` 
    : window.location.href;
  
  const shareText = score 
    ? `I just scored ${score.toLocaleString()} in ${title} on Glitch Games! Can you beat my score?` 
    : `Check out ${title} on Glitch Games!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook') => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Glitch Games',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">Share</h4>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="w-4 h-4 mr-1" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="w-4 h-4 mr-1" />
              Facebook
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1 text-success" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            
            {navigator.share && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNativeShare}
              >
                <Link2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SocialShare;

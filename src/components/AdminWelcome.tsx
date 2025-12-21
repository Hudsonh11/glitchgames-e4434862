import React, { useState } from 'react';
import { Shield, Crown, Lock, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

interface AdminWelcomeProps {
  onAccessGranted: () => void;
}

const AdminWelcome: React.FC<AdminWelcomeProps> = ({ onAccessGranted }) => {
  const { user, isLoggedIn } = useGame();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEnter = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onAccessGranted();
    }, 800);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You must be logged in to access the admin panel.
          </p>
          <Button variant="gaming" asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">Restricted Area</h1>
          <p className="text-muted-foreground mb-6">
            Sorry, you don't have admin privileges to access this panel.
          </p>
          <Button variant="outline" asChild>
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-110' : ''}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-warning/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Crown Animation */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-warning/30 to-warning/10 flex items-center justify-center mx-auto border border-warning/50 shadow-neon-gold animate-float">
            <Crown className="w-16 h-16 text-warning" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
          <span className="text-gradient">Welcome,</span>
          <br />
          <span className="text-warning">{user.username}</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8">
          You have full access to the Admin Command Center
        </p>

        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">User Management</p>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
            <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Game Controls</p>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
            <Crown className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Full Access</p>
          </div>
        </div>

        {/* Enter Button */}
        <Button 
          variant="gold" 
          size="xl" 
          onClick={handleEnter}
          className="gap-2 text-lg shadow-neon-gold"
        >
          <Crown className="w-5 h-5" />
          Enter Admin Panel
        </Button>
      </div>
    </div>
  );
};

export default AdminWelcome;

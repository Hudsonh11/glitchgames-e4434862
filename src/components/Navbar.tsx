import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, User, Trophy, Gift, Settings, Menu, X, Crown, LogOut, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UltraCurrencyDisplay from '@/components/UltraCurrencyDisplay';
import UltraBadge from '@/components/UltraBadge';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isLoggedIn, logout, coins, gems, currentStreak } = useGame();

  const navItems = [
    { path: '/', label: 'Games', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/rewards', label: 'Rewards', icon: Gift },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-neon-cyan group-hover:animate-pulse-glow transition-all relative overflow-hidden">
              <Gamepad2 className="w-6 h-6 text-primary-foreground relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>
            <span className="font-display text-xl font-bold text-gradient hidden sm:block">
              GLITCH GAMES
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? "gaming" : "ghost"}
                  size="sm"
                  className={`gap-2 relative ${isActive(path) ? 'shadow-glow' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {isActive(path) && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
                  )}
                </Button>
              </Link>
            ))}
            {user?.isAdmin && (
              <Link to="/admin">
                <Button variant="gold" size="sm" className="gap-2">
                  <Crown className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Currency Display */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 hover:border-warning/40 transition-colors">
                    <span className="text-lg">🪙</span>
                    <span className="text-warning font-bold text-sm">{coins.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 hover:border-secondary/40 transition-colors">
                    <span className="text-lg">💎</span>
                    <span className="text-secondary font-bold text-sm">{gems.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* User Avatar with Streak */}
                <Link to="/profile" className="flex items-center gap-2 group">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-colors group-hover:shadow-glow">
                      <img
                        src={user?.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {currentStreak > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-5 h-5 shadow-lg animate-pulse">
                            <Flame className="w-3 h-3 text-white fill-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-card border-primary/20">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                            <span className="font-bold">{currentStreak} day streak!</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-display font-bold leading-tight">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">Level {user?.level}</p>
                  </div>
                </Link>
                
                <Button variant="ghost" size="icon" onClick={logout} className="hidden md:flex hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="gaming" size="sm" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            {/* Mobile Currency */}
            {isLoggedIn && (
              <div className="flex gap-2 mb-4 px-2">
                <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-warning/10 border border-warning/20">
                  <span>🪙</span>
                  <span className="text-warning font-bold">{coins}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <span>💎</span>
                  <span className="text-secondary font-bold">{gems}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={isActive(path) ? "gaming" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              {user?.isAdmin && (
                <Link to="/admin" onClick={() => setIsOpen(false)}>
                  <Button variant="gold" className="w-full justify-start gap-2">
                    <Crown className="w-4 h-4" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              {isLoggedIn && (
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

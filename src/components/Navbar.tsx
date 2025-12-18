import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, User, Trophy, Gift, Settings, Menu, X, Crown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isLoggedIn, logout, coins, gems } = useGame();

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
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-neon-cyan group-hover:animate-pulse-glow transition-all">
              <Gamepad2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-gradient hidden sm:block animate-glitch">
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
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
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
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-warning/20 border border-warning/30">
                    <span className="text-warning font-bold">{coins}</span>
                    <span className="text-warning text-xs">coins</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/30">
                    <span className="text-secondary font-bold">{gems}</span>
                    <span className="text-secondary text-xs">gems</span>
                  </div>
                </div>
                <Link to="/profile" className="flex items-center gap-2">
                  <img
                    src={user?.avatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border-2 border-primary"
                  />
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} className="hidden md:flex">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="gaming" size="sm">
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
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
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
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
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

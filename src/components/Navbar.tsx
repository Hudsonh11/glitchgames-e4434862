import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, User, Trophy, Gift, Settings, Menu, X, Crown, LogOut, Flame, Sparkles, ChevronDown, Zap, Star, TrendingUp, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import SearchGames from '@/components/SearchGames';
import Notifications from '@/components/Notifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

const allGames = [
  { id: 'block-blast', title: 'Block Blast', category: 'Puzzle', rating: 4.8, color: 'hsl(185, 100%, 50%)' },
  { id: 'tetris', title: 'Tetris', category: 'Puzzle', rating: 4.9, color: 'hsl(280, 100%, 60%)' },
  { id: 'pac-man', title: 'Pac-Man', category: 'Arcade', rating: 4.9, color: 'hsl(45, 100%, 55%)' },
  { id: 'snake', title: 'Snake', category: 'Arcade', rating: 4.7, color: 'hsl(142, 76%, 50%)' },
  { id: 'wordle', title: 'Wordle', category: 'Word', rating: 4.9, color: 'hsl(142, 76%, 40%)' },
  { id: 'chess', title: 'Chess', category: 'Strategy', rating: 4.9, color: 'hsl(30, 20%, 30%)' },
  { id: 'geometry-dash', title: 'Geometry Dash', category: 'Action', rating: 4.9, color: 'hsl(320, 100%, 60%)' },
  { id: '2048', title: '2048', category: 'Puzzle', rating: 4.8, color: 'hsl(30, 100%, 50%)' },
  { id: 'flappy', title: 'Flappy Bird', category: 'Arcade', rating: 4.6, color: 'hsl(45, 100%, 55%)' },
  { id: 'sudoku', title: 'Sudoku', category: 'Puzzle', rating: 4.7, color: 'hsl(210, 100%, 45%)' },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isLoggedIn, logout, coins, gems, currentStreak } = useGame();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [notifications, setNotifications] = useState([
    { id: '1', type: 'reward' as const, title: 'Daily Reward Ready!', message: 'Your daily reward is waiting for you.', timestamp: new Date(), read: false },
    { id: '2', type: 'system' as const, title: 'Welcome to Glitch Games!', message: 'Explore 50+ games and earn rewards.', timestamp: new Date(Date.now() - 3600000), read: true },
  ]);

  const navItems = [
    { path: '/', label: 'Games', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/rewards', label: 'Rewards', icon: Gift },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleMarkRead = (id: string) => setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
  const handleMarkAllRead = () => setNotifications(n => n.map(notif => ({ ...notif, read: true })));
  const handleClearNotification = (id: string) => setNotifications(n => n.filter(notif => notif.id !== id));

  const xpProgress = user ? ((user.xp || 0) % 100) : 0;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-panel border-b border-border/50 shadow-lg' : 'bg-background/60 backdrop-blur-md border-b border-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-neon-cyan group-hover:animate-pulse-glow transition-all relative overflow-hidden">
              <Gamepad2 className="w-6 h-6 text-primary-foreground relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-bold text-gradient leading-none">
                GLITCH GAMES
              </span>
              <div className="text-[9px] text-muted-foreground tracking-widest uppercase">Play • Compete • Win</div>
            </div>
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
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchGames games={allGames} />
            </div>

            {isLoggedIn ? (
              <>
                <Notifications
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onClear={handleClearNotification}
                />

                {/* Currency Display */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20 hover:border-warning/40 transition-colors cursor-default">
                        <span className="text-sm">🪙</span>
                        <span className="text-warning font-bold text-xs">{coins.toLocaleString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Coins - Earn by playing games</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 hover:border-secondary/40 transition-colors cursor-default">
                        <span className="text-sm">💎</span>
                        <span className="text-secondary font-bold text-xs">{gems.toLocaleString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Gems - Premium currency</TooltipContent>
                  </Tooltip>
                  {currentStreak > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 cursor-default">
                          <Flame className="w-3.5 h-3.5 text-destructive fill-destructive" />
                          <span className="text-destructive font-bold text-xs">{currentStreak}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{currentStreak} day streak! 🔥</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 group outline-none">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-colors group-hover:shadow-glow">
                          <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        {/* XP ring indicator */}
                        <svg className="absolute -inset-0.5 w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                          <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
                            strokeDasharray={`${xpProgress} ${100 - xpProgress}`} strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-display font-bold leading-tight">{user?.username}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          Level {user?.level}
                        </p>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-3 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                        <img src={user?.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold">{user?.username}</p>
                        <p className="text-xs text-muted-foreground">Level {user?.level} • {user?.xp || 0} XP</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/rewards" className="flex items-center gap-2 cursor-pointer">
                        <Gift className="w-4 h-4" /> Rewards
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="lg:hidden">
                      <span className="flex items-center gap-2">🪙 {coins.toLocaleString()} coins</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="lg:hidden">
                      <span className="flex items-center gap-2">💎 {gems.toLocaleString()} gems</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="lg:hidden" />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            {isLoggedIn && (
              <div className="flex gap-2 mb-4 px-2">
                <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-warning/10 border border-warning/20">
                  <span>🪙</span>
                  <span className="text-warning font-bold text-sm">{coins.toLocaleString()}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <span>💎</span>
                  <span className="text-secondary font-bold text-sm">{gems.toLocaleString()}</span>
                </div>
                {currentStreak > 0 && (
                  <div className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <Flame className="w-4 h-4 text-destructive fill-destructive" />
                    <span className="text-destructive font-bold text-sm">{currentStreak}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setIsOpen(false)}>
                  <Button variant={isActive(path) ? "gaming" : "ghost"} className="w-full justify-start gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                <Button variant={isActive('/profile') ? "gaming" : "ghost"} className="w-full justify-start gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
              <Link to="/settings" onClick={() => setIsOpen(false)}>
                <Button variant={isActive('/settings') ? "gaming" : "ghost"} className="w-full justify-start gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
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

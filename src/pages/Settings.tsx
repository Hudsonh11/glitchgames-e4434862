import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Volume2, VolumeX, Bell, Shield, Palette, HelpCircle, 
  Monitor, Moon, Sun, Zap, Eye, Languages, Download, Trash2,
  Keyboard, Gamepad2, RefreshCw, Database, AlertTriangle,
  User, Lock, Mail, Clock, Vibrate, MessageSquare, Trophy,
  Sparkles, Target, BellRing, BellOff, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Settings: React.FC = () => {
  const { isLoggedIn, soundSettings, updateSoundSettings, user, logout } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Local settings state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('reducedMotion') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('autoSave') !== 'false');
  const [showFPS, setShowFPS] = useState(() => localStorage.getItem('showFPS') === 'true');
  const [gamepadEnabled, setGamepadEnabled] = useState(() => localStorage.getItem('gamepadEnabled') !== 'false');
  const [particleEffects, setParticleEffects] = useState(() => localStorage.getItem('particleEffects') !== 'false');
  
  // New settings
  const [screenShake, setScreenShake] = useState(() => localStorage.getItem('screenShake') !== 'false');
  const [hapticFeedback, setHapticFeedback] = useState(() => localStorage.getItem('hapticFeedback') !== 'false');
  const [colorblindMode, setColorblindMode] = useState(() => localStorage.getItem('colorblindMode') || 'none');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fontSize') || '100'));
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem('autoPlay') !== 'false');
  const [showTutorials, setShowTutorials] = useState(() => localStorage.getItem('showTutorials') !== 'false');
  const [confirmQuit, setConfirmQuit] = useState(() => localStorage.getItem('confirmQuit') !== 'false');
  const [chatSounds, setChatSounds] = useState(() => localStorage.getItem('chatSounds') !== 'false');
  const [leaderboardNotifications, setLeaderboardNotifications] = useState(() => localStorage.getItem('leaderboardNotifications') !== 'false');
  const [achievementPopups, setAchievementPopups] = useState(() => localStorage.getItem('achievementPopups') !== 'false');
  
  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('reducedMotion', String(reducedMotion));
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('highContrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('autoSave', String(autoSave));
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem('showFPS', String(showFPS));
  }, [showFPS]);

  useEffect(() => {
    localStorage.setItem('gamepadEnabled', String(gamepadEnabled));
  }, [gamepadEnabled]);

  useEffect(() => {
    localStorage.setItem('particleEffects', String(particleEffects));
  }, [particleEffects]);

  // New settings effects
  useEffect(() => {
    localStorage.setItem('screenShake', String(screenShake));
  }, [screenShake]);

  useEffect(() => {
    localStorage.setItem('hapticFeedback', String(hapticFeedback));
  }, [hapticFeedback]);

  useEffect(() => {
    localStorage.setItem('colorblindMode', colorblindMode);
    document.documentElement.setAttribute('data-colorblind', colorblindMode);
  }, [colorblindMode]);

  useEffect(() => {
    localStorage.setItem('fontSize', String(fontSize));
    document.documentElement.style.setProperty('--user-font-scale', `${fontSize / 100}`);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('autoPlay', String(autoPlay));
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('showTutorials', String(showTutorials));
  }, [showTutorials]);

  useEffect(() => {
    localStorage.setItem('confirmQuit', String(confirmQuit));
  }, [confirmQuit]);

  useEffect(() => {
    localStorage.setItem('chatSounds', String(chatSounds));
  }, [chatSounds]);

  useEffect(() => {
    localStorage.setItem('leaderboardNotifications', String(leaderboardNotifications));
  }, [leaderboardNotifications]);

  useEffect(() => {
    localStorage.setItem('achievementPopups', String(achievementPopups));
  }, [achievementPopups]);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const handleExportData = () => {
    const data = {
      username: user?.username,
      coins: user?.coins,
      gems: user?.gems,
      level: user?.level,
      xp: user?.xp,
      settings: {
        sound: soundSettings,
        theme,
        reducedMotion,
        highContrast,
        language,
      },
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gameverse-data-${user?.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Data Exported',
      description: 'Your data has been downloaded successfully.',
    });
  };

  const handleResetSettings = () => {
    localStorage.clear();
    updateSoundSettings({ masterVolume: 80, musicVolume: 70, sfxVolume: 80, isMuted: false });
    setTheme('dark');
    setReducedMotion(false);
    setHighContrast(false);
    setLanguage('en');
    setAutoSave(true);
    setShowFPS(false);
    setGamepadEnabled(true);
    setParticleEffects(true);
    setScreenShake(true);
    setHapticFeedback(true);
    setColorblindMode('none');
    setFontSize(100);
    setAutoPlay(true);
    setShowTutorials(true);
    setConfirmQuit(true);
    setChatSounds(true);
    setLeaderboardNotifications(true);
    setAchievementPopups(true);
    
    toast({
      title: 'Settings Reset',
      description: 'All settings have been restored to defaults.',
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Confirmation Required',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete user data from all tables
      const userId = user?.id;
      
      if (userId) {
        // Delete from all related tables
        await supabase.from('game_stats').delete().eq('user_id', userId);
        await supabase.from('achievements').delete().eq('user_id', userId);
        await supabase.from('daily_rewards').delete().eq('user_id', userId);
        await supabase.from('friendships').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        await supabase.from('activity_feed').delete().eq('user_id', userId);
        await supabase.from('player_titles').delete().eq('user_id', userId);
        await supabase.from('player_borders').delete().eq('user_id', userId);
        await supabase.from('player_themes').delete().eq('user_id', userId);
        await supabase.from('player_badges').delete().eq('user_id', userId);
        await supabase.from('player_status').delete().eq('user_id', userId);
        await supabase.from('ranked_stats').delete().eq('user_id', userId);
        await supabase.from('challenges').delete().or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`);
        await supabase.from('profiles').delete().eq('user_id', userId);
      }

      // Sign out and redirect
      await logout();
      localStorage.clear();
      
      toast({
        title: 'Account Deleted',
        description: 'Your account and all data have been permanently deleted.',
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const SettingsSection = ({ 
    icon: Icon, 
    title, 
    children, 
    iconColor = 'text-primary',
    gradient = false 
  }: { 
    icon: React.ElementType; 
    title: string; 
    children: React.ReactNode;
    iconColor?: string;
    gradient?: boolean;
  }) => (
    <section className="mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${gradient ? 'bg-gradient-hero' : 'bg-primary/10'}`}>
          <Icon className={`w-5 h-5 ${gradient ? 'text-primary-foreground' : iconColor}`} />
        </div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      
      <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shadow-lg">
        {children}
      </div>
    </section>
  );

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    description, 
    children,
    iconColor = 'text-muted-foreground'
  }: { 
    icon?: React.ElementType; 
    title: string; 
    description: string; 
    children: React.ReactNode;
    iconColor?: string;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold mb-2 text-gradient">Settings</h1>
            <p className="text-muted-foreground">Customize your gaming experience</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 hover:bg-primary/10 hover:border-primary/50"
              onClick={() => updateSoundSettings({ isMuted: !soundSettings.isMuted })}
            >
              {soundSettings.isMuted ? <VolumeX className="w-6 h-6 mb-2 text-destructive" /> : <Volume2 className="w-6 h-6 mb-2 text-success" />}
              <span className="text-xs">{soundSettings.isMuted ? 'Unmute' : 'Mute'}</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 hover:bg-primary/10 hover:border-primary/50"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Moon className="w-6 h-6 mb-2 text-primary" /> : <Sun className="w-6 h-6 mb-2 text-warning" />}
              <span className="text-xs">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 hover:bg-primary/10 hover:border-primary/50"
              onClick={() => setParticleEffects(!particleEffects)}
            >
              <Sparkles className={`w-6 h-6 mb-2 ${particleEffects ? 'text-warning' : 'text-muted-foreground'}`} />
              <span className="text-xs">Effects {particleEffects ? 'On' : 'Off'}</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 hover:bg-primary/10 hover:border-primary/50"
              onClick={handleExportData}
            >
              <Download className="w-6 h-6 mb-2 text-primary" />
              <span className="text-xs">Export</span>
            </Button>
          </div>

          {/* Sound Settings */}
          <SettingsSection icon={Volume2} title="Sound Settings" gradient>
            <div className="space-y-4">
              <SettingRow 
                icon={soundSettings.isMuted ? VolumeX : Volume2} 
                title="Mute All Sounds" 
                description="Turn off all game audio"
                iconColor={soundSettings.isMuted ? 'text-destructive' : 'text-success'}
              >
                <Switch
                  checked={soundSettings.isMuted}
                  onCheckedChange={(checked) => updateSoundSettings({ isMuted: checked })}
                />
              </SettingRow>

              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Master Volume</span>
                  <span className="text-primary font-bold">{soundSettings.masterVolume}%</span>
                </div>
                <Slider
                  value={[soundSettings.masterVolume]}
                  onValueChange={([value]) => updateSoundSettings({ masterVolume: value })}
                  max={100}
                  step={1}
                  disabled={soundSettings.isMuted}
                  className="cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Music Volume</span>
                  <span className="text-primary font-bold">{soundSettings.musicVolume}%</span>
                </div>
                <Slider
                  value={[soundSettings.musicVolume]}
                  onValueChange={([value]) => updateSoundSettings({ musicVolume: value })}
                  max={100}
                  step={1}
                  disabled={soundSettings.isMuted}
                  className="cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Sound Effects</span>
                  <span className="text-primary font-bold">{soundSettings.sfxVolume}%</span>
                </div>
                <Slider
                  value={[soundSettings.sfxVolume]}
                  onValueChange={([value]) => updateSoundSettings({ sfxVolume: value })}
                  max={100}
                  step={1}
                  disabled={soundSettings.isMuted}
                  className="cursor-pointer"
                />
              </div>

              <SettingRow 
                icon={MessageSquare} 
                title="Chat Sounds" 
                description="Play sounds for chat messages"
              >
                <Switch checked={chatSounds} onCheckedChange={setChatSounds} />
              </SettingRow>
            </div>
          </SettingsSection>

          {/* Display Settings */}
          <SettingsSection icon={Palette} title="Display & Appearance" iconColor="text-secondary">
            <div className="space-y-4">
              <SettingRow icon={theme === 'dark' ? Moon : Sun} title="Theme" description="Choose your preferred color scheme" iconColor={theme === 'dark' ? 'text-primary' : 'text-warning'}>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow icon={Zap} title="Particle Effects" description="Show visual effects in games" iconColor="text-warning">
                <Switch checked={particleEffects} onCheckedChange={setParticleEffects} />
              </SettingRow>

              <SettingRow icon={Vibrate} title="Screen Shake" description="Enable screen shake effects">
                <Switch checked={screenShake} onCheckedChange={setScreenShake} />
              </SettingRow>

              <SettingRow icon={Monitor} title="Show FPS Counter" description="Display frames per second" iconColor="text-success">
                <Switch checked={showFPS} onCheckedChange={setShowFPS} />
              </SettingRow>

              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">UI Scale</span>
                  <span className="text-primary font-bold">{fontSize}%</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={75}
                  max={150}
                  step={5}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </SettingsSection>

          {/* Accessibility */}
          <SettingsSection icon={Eye} title="Accessibility" iconColor="text-success">
            <div className="space-y-4">
              <SettingRow title="Reduced Motion" description="Minimize animations for accessibility">
                <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
              </SettingRow>
              
              <SettingRow title="High Contrast" description="Increase color contrast for better visibility">
                <Switch checked={highContrast} onCheckedChange={setHighContrast} />
              </SettingRow>

              <SettingRow title="Colorblind Mode" description="Adjust colors for color vision deficiency">
                <Select value={colorblindMode} onValueChange={setColorblindMode}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="protanopia">Protanopia</SelectItem>
                    <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                    <SelectItem value="tritanopia">Tritanopia</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow icon={Vibrate} title="Haptic Feedback" description="Vibration feedback on mobile">
                <Switch checked={hapticFeedback} onCheckedChange={setHapticFeedback} />
              </SettingRow>
            </div>
          </SettingsSection>

          {/* Game Settings */}
          <SettingsSection icon={Gamepad2} title="Game Settings" iconColor="text-warning">
            <div className="space-y-4">
              <SettingRow icon={Keyboard} title="Gamepad Support" description="Enable controller input">
                <Switch checked={gamepadEnabled} onCheckedChange={setGamepadEnabled} />
              </SettingRow>
              
              <SettingRow icon={Database} title="Auto-Save Progress" description="Automatically save game progress">
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </SettingRow>

              <SettingRow icon={Target} title="Show Tutorials" description="Display tutorial hints in games">
                <Switch checked={showTutorials} onCheckedChange={setShowTutorials} />
              </SettingRow>

              <SettingRow icon={AlertTriangle} title="Confirm Before Quitting" description="Ask before exiting a game">
                <Switch checked={confirmQuit} onCheckedChange={setConfirmQuit} />
              </SettingRow>

              <SettingRow icon={Clock} title="Auto-Play Next Game" description="Automatically start next round">
                <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
              </SettingRow>
            </div>
          </SettingsSection>

          {/* Language */}
          <SettingsSection icon={Languages} title="Language & Region" iconColor="text-primary">
            <SettingRow title="Language" description="Choose your preferred language">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                  <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                  <SelectItem value="pt">🇧🇷 Português</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={Bell} title="Notifications" iconColor="text-info">
            <div className="space-y-4">
              <SettingRow icon={BellRing} title="Daily Reward Reminder" description="Get notified when rewards are available">
                <Switch defaultChecked />
              </SettingRow>
              
              <SettingRow icon={User} title="Friend Activity" description="When friends beat your high scores">
                <Switch defaultChecked />
              </SettingRow>

              <SettingRow icon={Trophy} title="Leaderboard Updates" description="When your rank changes">
                <Switch checked={leaderboardNotifications} onCheckedChange={setLeaderboardNotifications} />
              </SettingRow>

              <SettingRow icon={Sparkles} title="Achievement Popups" description="Show achievement unlock notifications">
                <Switch checked={achievementPopups} onCheckedChange={setAchievementPopups} />
              </SettingRow>
              
              <SettingRow icon={BellOff} title="Promotional Offers" description="Special deals and events">
                <Switch />
              </SettingRow>
            </div>
          </SettingsSection>

          {/* Privacy & Security */}
          <SettingsSection icon={Shield} title="Privacy & Security" iconColor="text-destructive">
            <div className="space-y-4">
              <SettingRow icon={User} title="Show Profile Publicly" description="Allow others to view your profile">
                <Switch defaultChecked />
              </SettingRow>
              
              <SettingRow icon={Trophy} title="Show on Leaderboard" description="Display your scores publicly">
                <Switch defaultChecked />
              </SettingRow>

              <SettingRow icon={MessageSquare} title="Allow Friend Requests" description="Let others send you friend requests">
                <Switch defaultChecked />
              </SettingRow>

              <SettingRow icon={Mail} title="Allow Messages" description="Receive messages from friends">
                <Switch defaultChecked />
              </SettingRow>
            </div>
          </SettingsSection>

          {/* Data Management - Danger Zone */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/20">
                <Database className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="font-display text-xl font-bold">Data Management</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-destructive/30 space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 hover:bg-primary/10"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 text-primary" />
                Export My Data
                <span className="ml-auto text-xs text-muted-foreground">Download all your data</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 hover:bg-warning/10"
                onClick={handleResetSettings}
              >
                <RefreshCw className="w-4 h-4 text-warning" />
                Reset All Settings
                <span className="ml-auto text-xs text-muted-foreground">Restore defaults</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 text-destructive" />
                Sign Out
                <span className="ml-auto text-xs text-muted-foreground">Log out of your account</span>
              </Button>
              
              <div className="pt-4 border-t border-destructive/30">
                <div className="flex items-center gap-2 text-destructive mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-bold">Danger Zone</span>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account Permanently
                      <span className="ml-auto text-xs opacity-70">Cannot be undone</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-destructive/50">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Delete Your Account?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>This action is <strong>permanent and cannot be undone</strong>. All of your data will be deleted:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Your profile and progress</li>
                          <li>All coins, gems, and rewards</li>
                          <li>Game statistics and high scores</li>
                          <li>Friends and messages</li>
                          <li>Achievements and badges</li>
                        </ul>
                        <div className="pt-4">
                          <Label htmlFor="delete-confirm" className="text-foreground">
                            Type <strong className="text-destructive">DELETE</strong> to confirm:
                          </Label>
                          <Input
                            id="delete-confirm"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Type DELETE here"
                            className="mt-2 border-destructive/50 focus:border-destructive"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Forever'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>

          {/* Help & Support */}
          <SettingsSection icon={HelpCircle} title="Help & Support" iconColor="text-info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start hover:bg-primary/10">
                📖 Game Tutorials
              </Button>
              <Button variant="outline" className="justify-start hover:bg-primary/10">
                ❓ FAQ
              </Button>
              <Button variant="outline" className="justify-start hover:bg-primary/10">
                📧 Contact Support
              </Button>
              <Button variant="outline" className="justify-start hover:bg-primary/10">
                🐛 Report a Bug
              </Button>
              <Button variant="outline" className="justify-start hover:bg-primary/10">
                📜 Terms of Service
              </Button>
              <Button variant="outline" className="justify-start hover:bg-primary/10">
                🔒 Privacy Policy
              </Button>
            </div>
          </SettingsSection>

          {/* Version Info */}
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>Glitch Games v2.0.0</p>
            <p className="text-xs mt-1">Made with 💜 by the Glitch Team</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Volume2, VolumeX, Bell, Shield, Palette, HelpCircle, 
  Monitor, Moon, Sun, Zap, Eye, Languages, Download, Trash2,
  Keyboard, Gamepad2, RefreshCw, Database, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { isLoggedIn, soundSettings, updateSoundSettings, user } = useGame();
  const { toast } = useToast();
  
  // Local settings state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('reducedMotion') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('autoSave') !== 'false');
  const [showFPS, setShowFPS] = useState(() => localStorage.getItem('showFPS') === 'true');
  const [gamepadEnabled, setGamepadEnabled] = useState(() => localStorage.getItem('gamepadEnabled') !== 'false');
  const [particleEffects, setParticleEffects] = useState(() => localStorage.getItem('particleEffects') !== 'false');

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
    
    toast({
      title: 'Settings Reset',
      description: 'All settings have been restored to defaults.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-bold mb-8">Settings</h1>

          {/* Sound Settings */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Sound Settings</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-6">
              {/* Mute Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundSettings.isMuted ? (
                    <VolumeX className="w-5 h-5 text-destructive" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-success" />
                  )}
                  <div>
                    <p className="font-medium">Mute All Sounds</p>
                    <p className="text-sm text-muted-foreground">Turn off all game audio</p>
                  </div>
                </div>
                <Switch
                  checked={soundSettings.isMuted}
                  onCheckedChange={(checked) => updateSoundSettings({ isMuted: checked })}
                />
              </div>

              {/* Master Volume */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Master Volume</span>
                  <span className="text-primary">{soundSettings.masterVolume}%</span>
                </div>
                <Slider
                  value={[soundSettings.masterVolume]}
                  onValueChange={([value]) => updateSoundSettings({ masterVolume: value })}
                  max={100}
                  step={1}
                  disabled={soundSettings.isMuted}
                />
              </div>

              {/* Music Volume */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Music Volume</span>
                  <span className="text-primary">{soundSettings.musicVolume}%</span>
                </div>
                <Slider
                  value={[soundSettings.musicVolume]}
                  onValueChange={([value]) => updateSoundSettings({ musicVolume: value })}
                  max={100}
                  step={1}
                  disabled={soundSettings.isMuted}
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Sound Effects</span>
                  <span className="text-primary">{soundSettings.sfxVolume}%</span>
                </div>
                <Slider
                  value={[soundSettings.sfxVolume]}
                  onValueChange={([value]) => updateSoundSettings({ sfxVolume: value })}
                  max={100}
                  step={1}
                  disabled={soundSettings.isMuted}
                />
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Display & Appearance</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-warning" />}
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                  </div>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Particle Effects */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium">Particle Effects</p>
                    <p className="text-sm text-muted-foreground">Show visual effects in games</p>
                  </div>
                </div>
                <Switch
                  checked={particleEffects}
                  onCheckedChange={setParticleEffects}
                />
              </div>

              {/* Show FPS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Show FPS Counter</p>
                    <p className="text-sm text-muted-foreground">Display frames per second in games</p>
                  </div>
                </div>
                <Switch
                  checked={showFPS}
                  onCheckedChange={setShowFPS}
                />
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Accessibility</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reduced Motion</p>
                  <p className="text-sm text-muted-foreground">Minimize animations for accessibility</p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">Increase color contrast for better visibility</p>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                />
              </div>
            </div>
          </section>

          {/* Game Settings */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Game Settings</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Gamepad Support</p>
                    <p className="text-sm text-muted-foreground">Enable controller input for games</p>
                  </div>
                </div>
                <Switch
                  checked={gamepadEnabled}
                  onCheckedChange={setGamepadEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Auto-Save Progress</p>
                    <p className="text-sm text-muted-foreground">Automatically save game progress</p>
                  </div>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
            </div>
          </section>

          {/* Language */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Languages className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Language & Region</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred language</p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Notifications</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Reward Reminder</p>
                  <p className="text-sm text-muted-foreground">Get notified when rewards are available</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Friend Activity</p>
                  <p className="text-sm text-muted-foreground">When friends beat your high scores</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotional Offers</p>
                  <p className="text-sm text-muted-foreground">Special deals and events</p>
                </div>
                <Switch />
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Privacy & Security</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Profile Publicly</p>
                  <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show on Leaderboard</p>
                  <p className="text-sm text-muted-foreground">Display your scores publicly</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Data Management</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4" />
                Export My Data
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={handleResetSettings}
              >
                <RefreshCw className="w-4 h-4" />
                Reset All Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </section>

          {/* Help & Support */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Help & Support</h2>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <Button variant="outline" className="w-full justify-start">
                📖 Game Tutorials
              </Button>
              <Button variant="outline" className="w-full justify-start">
                ❓ FAQ
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📧 Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📜 Terms of Service
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🔒 Privacy Policy
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;

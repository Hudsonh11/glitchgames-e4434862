import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Volume2, VolumeX, Bell, Shield, Palette, HelpCircle,
  Monitor, Moon, Sun, Zap, Eye, Languages, Download, Trash2,
  Gamepad2, RefreshCw, AlertTriangle, User, Sparkles, LogOut, Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BugReportModal from '@/components/BugReportModal';
import UltraCard from '@/components/UltraCard';

const Settings: React.FC = () => {
  const { isLoggedIn, soundSettings, updateSoundSettings, user, logout } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  // ── settings state (persisted to localStorage) ──────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('reducedMotion') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem('autoSave') !== 'false');
  const [showFPS, setShowFPS] = useState(() => localStorage.getItem('showFPS') === 'true');
  const [gamepadEnabled, setGamepadEnabled] = useState(() => localStorage.getItem('gamepadEnabled') !== 'false');
  const [particleEffects, setParticleEffects] = useState(() => localStorage.getItem('particleEffects') !== 'false');
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

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── persistence side effects ────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('theme', theme); document.documentElement.classList.toggle('light', theme === 'light'); }, [theme]);
  useEffect(() => { localStorage.setItem('reducedMotion', String(reducedMotion)); document.documentElement.classList.toggle('reduce-motion', reducedMotion); }, [reducedMotion]);
  useEffect(() => { localStorage.setItem('highContrast', String(highContrast)); document.documentElement.classList.toggle('high-contrast', highContrast); }, [highContrast]);
  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  useEffect(() => { localStorage.setItem('autoSave', String(autoSave)); }, [autoSave]);
  useEffect(() => { localStorage.setItem('showFPS', String(showFPS)); }, [showFPS]);
  useEffect(() => { localStorage.setItem('gamepadEnabled', String(gamepadEnabled)); }, [gamepadEnabled]);
  useEffect(() => { localStorage.setItem('particleEffects', String(particleEffects)); }, [particleEffects]);
  useEffect(() => { localStorage.setItem('screenShake', String(screenShake)); }, [screenShake]);
  useEffect(() => { localStorage.setItem('hapticFeedback', String(hapticFeedback)); }, [hapticFeedback]);
  useEffect(() => { localStorage.setItem('colorblindMode', colorblindMode); document.documentElement.setAttribute('data-colorblind', colorblindMode); }, [colorblindMode]);
  useEffect(() => { localStorage.setItem('fontSize', String(fontSize)); document.documentElement.style.setProperty('--user-font-scale', `${fontSize / 100}`); }, [fontSize]);
  useEffect(() => { localStorage.setItem('autoPlay', String(autoPlay)); }, [autoPlay]);
  useEffect(() => { localStorage.setItem('showTutorials', String(showTutorials)); }, [showTutorials]);
  useEffect(() => { localStorage.setItem('confirmQuit', String(confirmQuit)); }, [confirmQuit]);
  useEffect(() => { localStorage.setItem('chatSounds', String(chatSounds)); }, [chatSounds]);
  useEffect(() => { localStorage.setItem('leaderboardNotifications', String(leaderboardNotifications)); }, [leaderboardNotifications]);
  useEffect(() => { localStorage.setItem('achievementPopups', String(achievementPopups)); }, [achievementPopups]);

  if (!isLoggedIn) return <Navigate to="/login" />;

  // ── actions ─────────────────────────────────────────────────────────────
  const handleExportData = () => {
    const data = {
      username: user?.username, coins: user?.coins, gems: user?.gems, level: user?.level, xp: user?.xp,
      settings: { sound: soundSettings, theme, reducedMotion, highContrast, language },
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `glitch-games-data-${user?.username}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data Exported', description: 'Your data has been downloaded.' });
  };

  const handleResetSettings = () => {
    localStorage.clear();
    updateSoundSettings({ masterVolume: 80, musicVolume: 70, sfxVolume: 80, isMuted: false });
    setTheme('dark'); setReducedMotion(false); setHighContrast(false); setLanguage('en');
    setAutoSave(true); setShowFPS(false); setGamepadEnabled(true); setParticleEffects(true);
    setScreenShake(true); setHapticFeedback(true); setColorblindMode('none'); setFontSize(100);
    setAutoPlay(true); setShowTutorials(true); setConfirmQuit(true); setChatSounds(true);
    setLeaderboardNotifications(true); setAchievementPopups(true);
    toast({ title: 'Settings Reset', description: 'All settings restored to defaults.' });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({ title: 'Confirmation Required', description: 'Please type DELETE to confirm.', variant: 'destructive' });
      return;
    }
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' }); setIsDeleting(false); return; }
      const response = await supabase.functions.invoke('delete-account', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (response.error) throw new Error(response.error.message || 'Failed to delete account');
      const result = response.data;
      if (!result?.success) throw new Error(result?.error || 'Failed to delete account');
      localStorage.clear(); sessionStorage.clear();
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      navigate('/');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete account.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally { setIsDeleting(false); }
  };

  // ── UI primitives ───────────────────────────────────────────────────────
  const Row = ({ icon: Icon, label, description, children }: { icon?: React.ElementType; label: string; description?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />}
        <div className="min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />

      <div className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-gradient">Settings</h1>
            <p className="text-muted-foreground">Tune your experience</p>
          </div>

          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 h-auto">
              <TabsTrigger value="account" className="flex flex-col gap-1 py-2"><User className="w-4 h-4" /><span className="text-xs">Account</span></TabsTrigger>
              <TabsTrigger value="appearance" className="flex flex-col gap-1 py-2"><Palette className="w-4 h-4" /><span className="text-xs">Appearance</span></TabsTrigger>
              <TabsTrigger value="audio" className="flex flex-col gap-1 py-2"><Volume2 className="w-4 h-4" /><span className="text-xs">Audio</span></TabsTrigger>
              <TabsTrigger value="gameplay" className="flex flex-col gap-1 py-2"><Gamepad2 className="w-4 h-4" /><span className="text-xs">Gameplay</span></TabsTrigger>
              <TabsTrigger value="notifications" className="flex flex-col gap-1 py-2"><Bell className="w-4 h-4" /><span className="text-xs">Notify</span></TabsTrigger>
              <TabsTrigger value="privacy" className="flex flex-col gap-1 py-2"><Shield className="w-4 h-4" /><span className="text-xs">Privacy</span></TabsTrigger>
            </TabsList>

            {/* ─── Account ─── */}
            <TabsContent value="account" className="space-y-4">
              <UltraCard variant="glass" className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Account Info</h2>
                <Row icon={User} label="Username" description="Your public display name">
                  <span className="font-mono text-sm text-primary">{user?.username}</span>
                </Row>
                <Row label="Level" description="Earned through XP">
                  <span className="font-bold text-secondary">Lv. {user?.level || 1}</span>
                </Row>
                <Row icon={Languages} label="Language" description="Interface language">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row icon={LogOut} label="Sign out" description="End your current session">
                  <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>Sign out</Button>
                </Row>
              </UltraCard>
            </TabsContent>

            {/* ─── Appearance ─── */}
            <TabsContent value="appearance" className="space-y-4">
              <UltraCard variant="glass" className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-secondary" /> Look & Feel</h2>
                <Row icon={theme === 'dark' ? Moon : Sun} label="Theme" description="Light or dark mode">
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row icon={Eye} label="Reduced motion" description="Minimize animations and transitions">
                  <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
                </Row>
                <Row icon={Monitor} label="High contrast" description="Boost color contrast for readability">
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                </Row>
                <Row icon={Eye} label="Colorblind mode" description="Adjust palette for color vision">
                  <Select value={colorblindMode} onValueChange={setColorblindMode}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Off</SelectItem>
                      <SelectItem value="protanopia">Protanopia</SelectItem>
                      <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                      <SelectItem value="tritanopia">Tritanopia</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row icon={Sparkles} label="Particle effects" description="Background ambient particles">
                  <Switch checked={particleEffects} onCheckedChange={setParticleEffects} />
                </Row>
                <Row label="Font size" description={`${fontSize}% — affects in-game UI scaling`}>
                  <div className="w-32"><Slider value={[fontSize]} min={80} max={140} step={10} onValueChange={(v) => setFontSize(v[0])} /></div>
                </Row>
              </UltraCard>
            </TabsContent>

            {/* ─── Audio ─── */}
            <TabsContent value="audio" className="space-y-4">
              <UltraCard variant="glass" className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Volume2 className="w-5 h-5 text-warning" /> Sound</h2>
                <Row icon={soundSettings.isMuted ? VolumeX : Volume2} label="Mute all" description="Silences every sound effect and track">
                  <Switch checked={soundSettings.isMuted} onCheckedChange={(v) => updateSoundSettings({ isMuted: v })} />
                </Row>
                <Row label="Master volume" description={`${soundSettings.masterVolume}%`}>
                  <div className="w-40"><Slider value={[soundSettings.masterVolume]} max={100} step={5} onValueChange={(v) => updateSoundSettings({ masterVolume: v[0] })} disabled={soundSettings.isMuted} /></div>
                </Row>
                <Row label="Music volume" description={`${soundSettings.musicVolume}%`}>
                  <div className="w-40"><Slider value={[soundSettings.musicVolume]} max={100} step={5} onValueChange={(v) => updateSoundSettings({ musicVolume: v[0] })} disabled={soundSettings.isMuted} /></div>
                </Row>
                <Row label="SFX volume" description={`${soundSettings.sfxVolume}%`}>
                  <div className="w-40"><Slider value={[soundSettings.sfxVolume]} max={100} step={5} onValueChange={(v) => updateSoundSettings({ sfxVolume: v[0] })} disabled={soundSettings.isMuted} /></div>
                </Row>
                <Row label="Chat sounds" description="Play a tone on incoming messages">
                  <Switch checked={chatSounds} onCheckedChange={setChatSounds} />
                </Row>
              </UltraCard>
            </TabsContent>

            {/* ─── Gameplay ─── */}
            <TabsContent value="gameplay" className="space-y-4">
              <UltraCard variant="glass" className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-success" /> Gameplay</h2>
                <Row icon={Zap} label="Auto-save progress" description="Sync game state to the cloud automatically">
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </Row>
                <Row icon={Monitor} label="Show FPS" description="Display performance counter in games">
                  <Switch checked={showFPS} onCheckedChange={setShowFPS} />
                </Row>
                <Row icon={Gamepad2} label="Gamepad support" description="Enable controller input where available">
                  <Switch checked={gamepadEnabled} onCheckedChange={setGamepadEnabled} />
                </Row>
                <Row label="Screen shake" description="Camera shake on impacts">
                  <Switch checked={screenShake} onCheckedChange={setScreenShake} />
                </Row>
                <Row label="Haptic feedback" description="Vibrate on mobile actions">
                  <Switch checked={hapticFeedback} onCheckedChange={setHapticFeedback} />
                </Row>
                <Row label="Auto-play music" description="Start music automatically in games">
                  <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                </Row>
                <Row label="Show tutorials" description="Display tips on first play">
                  <Switch checked={showTutorials} onCheckedChange={setShowTutorials} />
                </Row>
                <Row label="Confirm before quitting" description="Ask before leaving an active game">
                  <Switch checked={confirmQuit} onCheckedChange={setConfirmQuit} />
                </Row>
              </UltraCard>
            </TabsContent>

            {/* ─── Notifications ─── */}
            <TabsContent value="notifications" className="space-y-4">
              <UltraCard variant="glass" className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notifications</h2>
                <Row label="Achievement pop-ups" description="Toast when you unlock an achievement">
                  <Switch checked={achievementPopups} onCheckedChange={setAchievementPopups} />
                </Row>
                <Row label="Leaderboard alerts" description="Notify when you're passed or set a record">
                  <Switch checked={leaderboardNotifications} onCheckedChange={setLeaderboardNotifications} />
                </Row>
              </UltraCard>
            </TabsContent>

            {/* ─── Privacy / Data / Danger ─── */}
            <TabsContent value="privacy" className="space-y-4">
              <UltraCard variant="glass" className="p-6">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-secondary" /> Data</h2>
                <Row icon={Download} label="Export your data" description="Download a JSON copy of your account">
                  <Button size="sm" variant="outline" onClick={handleExportData}>Export</Button>
                </Row>
                <Row icon={RefreshCw} label="Reset settings" description="Restore everything to defaults">
                  <Button size="sm" variant="outline" onClick={handleResetSettings}>Reset</Button>
                </Row>
                <Row icon={Bug} label="Report a bug" description="Help us squash issues fast">
                  <Button size="sm" variant="outline" onClick={() => setIsBugReportOpen(true)}>Open</Button>
                </Row>
                <Row icon={HelpCircle} label="Support" description="Use the chat bubble bottom-right anytime">
                  <span className="text-xs text-muted-foreground">Pixel Bot</span>
                </Row>
              </UltraCard>

              <UltraCard variant="glass" className="p-6 border-destructive/40">
                <h2 className="font-display text-xl font-bold mb-1 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h2>
                <p className="text-xs text-muted-foreground mb-4">These actions cannot be undone.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete account permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes your profile, scores, friends, purchases, and all related data. Type <strong>DELETE</strong> below to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                      placeholder="Type DELETE to confirm"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="my-2"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirmation !== 'DELETE'} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Delete forever'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </UltraCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;

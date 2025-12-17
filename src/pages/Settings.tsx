import React from 'react';
import { Navigate } from 'react-router-dom';
import { Volume2, VolumeX, Bell, Shield, Palette, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';

const Settings: React.FC = () => {
  const { isLoggedIn, soundSettings, updateSoundSettings } = useGame();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

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

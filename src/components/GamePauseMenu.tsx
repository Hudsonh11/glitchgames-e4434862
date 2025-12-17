import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Home, Volume2 } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { Slider } from '@/components/ui/slider';

interface GamePauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  score: number;
}

const GamePauseMenu: React.FC<GamePauseMenuProps> = ({
  isOpen,
  onResume,
  onRestart,
  onQuit,
  score,
}) => {
  const { soundSettings, updateSoundSettings } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 p-6 rounded-2xl bg-card border border-border shadow-2xl animate-scale-in">
        <h2 className="font-display text-2xl font-bold text-center mb-2 text-gradient">
          Game Paused
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Current Score: <span className="text-primary font-bold">{score}</span>
        </p>

        {/* Sound Settings */}
        <div className="mb-6 p-4 rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="font-display font-bold">Sound</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Master</span>
                <span className="text-primary">{soundSettings.masterVolume}%</span>
              </div>
              <Slider
                value={[soundSettings.masterVolume]}
                onValueChange={([value]) => updateSoundSettings({ masterVolume: value })}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Music</span>
                <span className="text-primary">{soundSettings.musicVolume}%</span>
              </div>
              <Slider
                value={[soundSettings.musicVolume]}
                onValueChange={([value]) => updateSoundSettings({ musicVolume: value })}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">SFX</span>
                <span className="text-primary">{soundSettings.sfxVolume}%</span>
              </div>
              <Slider
                value={[soundSettings.sfxVolume]}
                onValueChange={([value]) => updateSoundSettings({ sfxVolume: value })}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="gaming" className="w-full gap-2" onClick={onResume}>
            <Play className="w-5 h-5" />
            Resume
          </Button>
          <Button variant="secondary" className="w-full gap-2" onClick={onRestart}>
            <RotateCcw className="w-5 h-5" />
            Restart
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onQuit}>
            <Home className="w-5 h-5" />
            Quit to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GamePauseMenu;

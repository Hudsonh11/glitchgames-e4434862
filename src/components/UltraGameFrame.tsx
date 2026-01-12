import React from 'react';
import { Gamepad2, Zap, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UltraGameFrameProps {
  title: string;
  children: React.ReactNode;
  score?: number;
  lives?: number;
  isPaused?: boolean;
  onPause?: () => void;
  onRestart?: () => void;
  onBack?: () => void;
  showControls?: boolean;
}

const UltraGameFrame: React.FC<UltraGameFrameProps> = ({
  title,
  children,
  score,
  lives,
  isPaused = false,
  onPause,
  onRestart,
  onBack,
  showControls = true,
}) => {
  return (
    <div className="relative">
      {/* Game header */}
      <div className="flex items-center justify-between mb-4 glass-panel rounded-xl p-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-display font-bold text-lg">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score display */}
          {score !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-primary">{score.toLocaleString()}</span>
            </div>
          )}

          {/* Lives display */}
          {lives !== undefined && (
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg transition-all duration-300 ${i < lives ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}
                >
                  ❤️
                </span>
              ))}
            </div>
          )}

          {/* Game controls */}
          {showControls && (
            <div className="flex items-center gap-2">
              {onPause && (
                <Button variant="ghost" size="icon" onClick={onPause}>
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
              )}
              {onRestart && (
                <Button variant="ghost" size="icon" onClick={onRestart}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game container */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-premium">
        {/* Animated corner decorations */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-2xl" />

        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 4px)',
          }}
        />

        {/* Game content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <Pause className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="font-display text-2xl font-bold mb-2">PAUSED</h3>
              <p className="text-muted-foreground">Press pause to continue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltraGameFrame;

import React, { useEffect, useState } from 'react';
import { X, Trophy, Gift, Zap, Star, AlertCircle, CheckCircle } from 'lucide-react';

type NotificationType = 'success' | 'reward' | 'achievement' | 'levelup' | 'warning' | 'info';

interface UltraNotificationProps {
  type?: NotificationType;
  title: string;
  message: string;
  onClose?: () => void;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

const typeConfig = {
  success: { icon: CheckCircle, color: 'success', bg: 'from-success/20 to-success/5' },
  reward: { icon: Gift, color: 'warning', bg: 'from-warning/20 to-warning/5' },
  achievement: { icon: Trophy, color: 'warning', bg: 'from-warning/20 via-amber-500/10 to-warning/5' },
  levelup: { icon: Zap, color: 'primary', bg: 'from-primary/20 via-secondary/10 to-primary/5' },
  warning: { icon: AlertCircle, color: 'destructive', bg: 'from-destructive/20 to-destructive/5' },
  info: { icon: Star, color: 'secondary', bg: 'from-secondary/20 to-secondary/5' },
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const UltraNotification: React.FC<UltraNotificationProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  duration = 5000,
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-50 ${positionClasses[position]}
        ${isExiting ? 'animate-fade-out' : 'animate-scale-in'}
      `}
    >
      <div className={`
        relative overflow-hidden rounded-2xl border border-${config.color}/30
        bg-gradient-to-r ${config.bg} backdrop-blur-xl
        p-4 pr-10 min-w-[300px] max-w-md
        shadow-lg shadow-${config.color}/10
      `}>
        {/* Animated border glow */}
        <div className={`absolute inset-0 rounded-2xl opacity-50 animate-pulse`}
          style={{ boxShadow: `inset 0 0 20px hsl(var(--${config.color}) / 0.1)` }}
        />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        
        <div className="relative flex items-start gap-3">
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-xl 
            bg-${config.color}/20 flex items-center justify-center
            animate-bounce
          `}>
            <Icon className={`w-5 h-5 text-${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-foreground mb-0.5">
              {title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 overflow-hidden rounded-b-2xl">
            <div
              className={`h-full bg-${config.color} transition-all ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes fade-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
        .animate-fade-out {
          animation: fade-out 0.3s ease-out forwards;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9) translateX(20px); }
          to { opacity: 1; transform: scale(1) translateX(0); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UltraNotification;

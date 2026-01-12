import React, { useEffect, useState } from 'react';

interface UltraCountdownProps {
  targetDate: Date;
  label?: string;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const UltraCountdown: React.FC<UltraCountdownProps> = ({
  targetDate,
  label = 'Time Remaining',
  onComplete,
  size = 'md',
  showLabels = true,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const sizeClasses = {
    sm: { box: 'w-12 h-12', number: 'text-lg', label: 'text-[10px]' },
    md: { box: 'w-16 h-16', number: 'text-2xl', label: 'text-xs' },
    lg: { box: 'w-20 h-20', number: 'text-3xl', label: 'text-sm' },
  };

  const s = sizeClasses[size];

  const TimeBox = ({ value, unit }: { value: number; unit: string }) => (
    <div className="flex flex-col items-center">
      <div className={`
        ${s.box} rounded-xl bg-gradient-to-br from-card to-muted
        border border-border flex items-center justify-center
        relative overflow-hidden group
        hover:border-primary/50 transition-all duration-300
      `}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <span className={`font-display font-black ${s.number} text-foreground relative z-10`}>
          {value.toString().padStart(2, '0')}
        </span>
        
        {/* Pulse effect on change */}
        <div className="absolute inset-0 bg-primary/10 animate-ping opacity-0" />
      </div>
      {showLabels && (
        <span className={`mt-1 ${s.label} text-muted-foreground uppercase tracking-wider`}>
          {unit}
        </span>
      )}
    </div>
  );

  const Separator = () => (
    <span className={`font-display font-bold ${s.number} text-primary animate-pulse self-start mt-4`}>
      :
    </span>
  );

  return (
    <div className="text-center">
      {label && (
        <p className="text-sm text-muted-foreground mb-3 font-medium">{label}</p>
      )}
      
      <div className="flex items-center justify-center gap-2">
        {timeLeft.days > 0 && (
          <>
            <TimeBox value={timeLeft.days} unit="Days" />
            <Separator />
          </>
        )}
        <TimeBox value={timeLeft.hours} unit="Hours" />
        <Separator />
        <TimeBox value={timeLeft.minutes} unit="Mins" />
        <Separator />
        <TimeBox value={timeLeft.seconds} unit="Secs" />
      </div>
    </div>
  );
};

export default UltraCountdown;

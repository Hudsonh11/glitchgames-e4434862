import React, { useState, useEffect } from 'react';
import { Clock, Gift, Sparkles } from 'lucide-react';
import UltraCard from './UltraCard';

interface CountdownProps {
  targetDate: Date;
  title: string;
  subtitle?: string;
  onComplete?: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, title, subtitle, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <UltraCard variant="gradient" glow className="p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        {isComplete ? (
          <Gift className="w-6 h-6 text-warning animate-bounce" />
        ) : (
          <Clock className="w-6 h-6 text-primary" />
        )}
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {!isComplete && <Sparkles className="w-5 h-5 text-secondary animate-pulse" />}
      </div>

      {subtitle && (
        <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      )}

      {isComplete ? (
        <div className="py-8">
          <div className="text-4xl font-bold text-gradient animate-pulse">
            🎉 Event Live! 🎉
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {timeUnits.map((unit) => (
            <div key={unit.label} className="bg-muted/50 rounded-xl p-3">
              <div className="text-3xl md:text-4xl font-bold text-foreground animate-counter-pop">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{unit.label}</div>
            </div>
          ))}
        </div>
      )}
    </UltraCard>
  );
};

export default Countdown;

import React, { useEffect, useState, useRef } from 'react';

interface UltraStatsCounterProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'warning' | 'success' | 'accent';
  suffix?: string;
  animateOnView?: boolean;
}

const UltraStatsCounter: React.FC<UltraStatsCounterProps> = ({
  value,
  label,
  icon,
  color = 'primary',
  suffix = '',
  animateOnView = true,
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(0);
  const [isVisible, setIsVisible] = useState(!animateOnView);
  const ref = useRef<HTMLDivElement>(null);

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    warning: 'text-warning',
    success: 'text-success',
    accent: 'text-accent',
  };

  const glowClasses = {
    primary: 'shadow-glow',
    secondary: 'shadow-neon-magenta',
    warning: 'shadow-neon-gold',
    success: 'shadow-[0_0_20px_hsl(var(--success)/0.3)]',
    accent: 'shadow-neon-magenta',
  };

  useEffect(() => {
    if (!animateOnView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [animateOnView]);

  useEffect(() => {
    if (!isVisible) return;

    // Parse numeric value
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) 
      : value;

    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const prefix = typeof value === 'string' ? value.match(/^[^0-9]*/)?.[0] || '' : '';
    const valueSuffix = typeof value === 'string' ? value.match(/[^0-9.]*$/)?.[0] || '' : '';

    let start = 0;
    const end = numericValue;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (end - start) * easeOutExpo);
      
      setDisplayValue(`${prefix}${current.toLocaleString()}${valueSuffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, isVisible]);

  return (
    <div
      ref={ref}
      className={`ultra-stat text-center p-6 rounded-2xl bg-card border border-border 
        transition-all duration-500 hover:border-${color}/50 
        hover:${glowClasses[color]} group cursor-default`}
    >
      {icon && (
        <div className={`mb-3 ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      )}
      <p className={`font-display text-3xl md:text-4xl font-bold ${colorClasses[color]} 
        transition-all duration-300 group-hover:scale-105`}>
        {displayValue}{suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-2">{label}</p>
    </div>
  );
};

export default UltraStatsCounter;

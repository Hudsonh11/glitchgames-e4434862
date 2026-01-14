import React from 'react';
import { cn } from '@/lib/utils';

interface UltraGlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'premium' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const UltraGlowButton: React.FC<UltraGlowButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  pulse = false,
  icon,
  iconPosition = 'left',
  className,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 overflow-hidden group';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70',
    premium: 'bg-gradient-to-r from-warning via-yellow-500 to-warning text-black hover:from-yellow-400 hover:to-yellow-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500',
    ghost: 'bg-white/5 text-foreground hover:bg-white/10 border border-white/10'
  };

  const glowStyles = {
    primary: 'shadow-[0_0_20px_rgba(var(--primary),0.5)] hover:shadow-[0_0_30px_rgba(var(--primary),0.7)]',
    premium: 'shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:shadow-[0_0_30px_rgba(234,179,8,0.7)]',
    success: 'shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)]',
    danger: 'shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.7)]',
    ghost: ''
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        glow && glowStyles[variant],
        pulse && 'animate-pulse',
        'hover:scale-105 active:scale-95',
        className
      )}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Ripple effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-white/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300" />
      </div>

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && iconPosition === 'left' && <span className="group-hover:scale-110 transition-transform">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="group-hover:scale-110 transition-transform">{icon}</span>}
      </span>
    </button>
  );
};

export default UltraGlowButton;

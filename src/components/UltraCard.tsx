import React, { useRef, useState } from 'react';

interface UltraCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'glass' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  tilt?: boolean;
  className?: string;
}

const UltraCard = React.forwardRef<HTMLDivElement, UltraCardProps & React.HTMLAttributes<HTMLDivElement>>(({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  tilt = false,
  className = '',
  ...rest
}, forwardedRef) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const cardRef = innerRef;
  React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLDivElement);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  const variantClasses = {
    default: 'bg-card border-border',
    premium: 'bg-gradient-premium border-primary/20',
    glass: 'glass-panel',
    gradient: 'bg-gradient-to-br from-card via-primary/5 to-card border-primary/30',
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-2xl border
        transition-all duration-500
        ${variantClasses[variant]}
        ${hover ? 'hover:border-primary/50 hover:shadow-premium hover:-translate-y-1' : ''}
        ${glow ? 'hover:shadow-glow' : ''}
        ${className}
      `}
      style={{
        transform: tilt 
          ? `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`
          : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {/* Shine effect on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 -translate-x-full hover:translate-x-full" />
      )}
      
      {/* Top highlight line */}
      {variant === 'premium' && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      )}
      
      {children}
    </div>
  );
});
UltraCard.displayName = 'UltraCard';

export default UltraCard;

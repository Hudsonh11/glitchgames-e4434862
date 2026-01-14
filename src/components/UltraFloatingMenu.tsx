import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface UltraFloatingMenuProps {
  items: MenuItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

const UltraFloatingMenu: React.FC<UltraFloatingMenuProps> = ({
  items,
  position = 'bottom-right',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const itemPositions = {
    'bottom-right': '-top-14',
    'bottom-left': '-top-14',
    'top-right': 'top-14',
    'top-left': 'top-14'
  };

  return (
    <div className={cn('fixed z-50', positionStyles[position], className)}>
      {/* Menu Items */}
      <div className="relative">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'absolute right-0 flex items-center gap-3 transition-all duration-300',
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            )}
            style={{
              bottom: isOpen ? `${(index + 1) * 56}px` : '0',
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
          >
            {/* Label */}
            <span className="px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
              {item.label}
            </span>
            
            {/* Icon Button */}
            <button
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110',
                item.color || 'bg-primary text-primary-foreground'
              )}
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300',
          'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
          'hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]',
          isOpen && 'rotate-45'
        )}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};

export default UltraFloatingMenu;

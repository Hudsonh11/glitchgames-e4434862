import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const OnlineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowBanner(true); setTimeout(() => setShowBanner(false), 3000); };
    const handleOffline = () => { setIsOnline(false); setShowBanner(true); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (!showBanner) return null;

  return (
    <div className={cn(
      "fixed top-16 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all animate-fade-in",
      isOnline ? "bg-success/20 text-success border-b border-success/30" : "bg-destructive/20 text-destructive border-b border-destructive/30"
    )}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {isOnline ? "You're back online!" : "You're offline. Some features may be unavailable."}
      </div>
    </div>
  );
};

export default OnlineStatus;

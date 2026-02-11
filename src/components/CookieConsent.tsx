import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setTimeout(() => setShow(true), 2000);
  }, []);

  if (!show) return null;

  const accept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="p-4 rounded-2xl bg-card border border-border shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">We use cookies 🍪</p>
            <p className="text-xs text-muted-foreground mb-3">
              We use cookies to save your preferences and game progress locally.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="gaming" onClick={accept}>Accept</Button>
              <Button size="sm" variant="ghost" onClick={accept}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

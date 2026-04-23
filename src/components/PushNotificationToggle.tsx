import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getPushPermission, requestPushPermission, isPushSupported } from '@/lib/push';
import { playSfx } from '@/lib/sfx';
import { useToast } from '@/hooks/use-toast';

const PushNotificationToggle: React.FC = () => {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(() => localStorage.getItem('pushEnabled') !== 'false');

  useEffect(() => {
    setPermission(getPushPermission());
  }, []);

  const enable = async () => {
    const result = await requestPushPermission();
    setPermission(result);
    if (result === 'granted') {
      localStorage.setItem('pushEnabled', 'true');
      setEnabled(true);
      playSfx('success');
      toast({ title: '🔔 Push notifications enabled', description: 'You’ll be notified when something cool happens.' });
    } else if (result === 'denied') {
      toast({ title: 'Permission denied', description: 'Enable notifications in your browser settings.', variant: 'destructive' });
    }
  };

  const togglePref = (v: boolean) => {
    localStorage.setItem('pushEnabled', String(v));
    setEnabled(v);
    if (v) playSfx('click');
  };

  if (!isPushSupported()) {
    return (
      <p className="text-xs text-muted-foreground">Your browser does not support push notifications.</p>
    );
  }

  return (
    <div className="space-y-3">
      {permission === 'default' && (
        <Button variant="gaming" size="sm" onClick={enable} className="w-full sm:w-auto">
          <Bell className="w-4 h-4 mr-2" /> Enable browser notifications
        </Button>
      )}
      {permission === 'granted' && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {enabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm">Push notifications</span>
          </div>
          <Switch checked={enabled} onCheckedChange={togglePref} />
        </div>
      )}
      {permission === 'denied' && (
        <p className="text-xs text-destructive">Notifications are blocked. Re-enable them in your browser site settings.</p>
      )}
      <Button variant="ghost" size="sm" onClick={() => playSfx('notification')} className="text-xs">
        <Volume2 className="w-3 h-3 mr-1" /> Test sound
      </Button>
    </div>
  );
};

export default PushNotificationToggle;

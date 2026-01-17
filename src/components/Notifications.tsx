import React, { useState, useEffect } from 'react';
import { Bell, X, Trophy, Gift, Users, Gamepad2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'achievement' | 'reward' | 'friend' | 'game' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: (id: string) => void;
}

const iconMap = {
  achievement: Trophy,
  reward: Gift,
  friend: Users,
  game: Gamepad2,
  system: Sparkles,
};

const colorMap = {
  achievement: 'text-warning bg-warning/20',
  reward: 'text-success bg-success/20',
  friend: 'text-primary bg-primary/20',
  game: 'text-secondary bg-secondary/20',
  system: 'text-accent bg-accent/20',
};

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className={cn("w-5 h-5", isOpen && "text-primary")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-error-foreground text-xs font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className={cn(
            "absolute right-0 top-full mt-2 w-80 sm:w-96 z-50",
            "rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl",
            "animate-in slide-in-from-top-4 fade-in duration-200"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* Content */}
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification, index) => {
                    const Icon = iconMap[notification.type];
                    const colorClass = colorMap[notification.type];
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer",
                          !notification.read && "bg-primary/5",
                          "animate-fade-in-up"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => onMarkRead(notification.id)}
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "font-medium text-sm",
                              !notification.read && "font-bold"
                            )}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClear(notification.id);
                              }}
                              className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;

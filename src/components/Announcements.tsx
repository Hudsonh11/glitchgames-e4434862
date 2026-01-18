import React, { useState } from 'react';
import { Megaphone, ChevronRight, X, Sparkles, Gift, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from './UltraCard';
import UltraBadge from './UltraBadge';

interface Announcement {
  id: string;
  type: 'update' | 'event' | 'promotion';
  title: string;
  description: string;
  date: string;
  isNew: boolean;
}

const announcements: Announcement[] = [
  {
    id: '1',
    type: 'update',
    title: 'New Game Added: Geometry Dash 2.0',
    description: 'Experience the upgraded version with new levels and challenges!',
    date: '2 hours ago',
    isNew: true,
  },
  {
    id: '2',
    type: 'event',
    title: 'Weekend Tournament Starts Friday',
    description: 'Compete for a chance to win 10,000 coins and exclusive badges!',
    date: '1 day ago',
    isNew: true,
  },
  {
    id: '3',
    type: 'promotion',
    title: 'Double XP Week',
    description: 'Earn 2x XP on all games until Sunday!',
    date: '2 days ago',
    isNew: false,
  },
];

const typeConfig = {
  update: { icon: Zap, color: 'primary', label: 'Update' },
  event: { icon: Sparkles, color: 'secondary', label: 'Event' },
  promotion: { icon: Gift, color: 'warning', label: 'Promotion' },
};

const Announcements: React.FC = () => {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <UltraCard variant="glass" className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Announcements</h3>
        <UltraBadge variant="rare" size="sm">{visibleAnnouncements.length}</UltraBadge>
      </div>

      <div className="space-y-3">
        {visibleAnnouncements.map((announcement) => {
          const config = typeConfig[announcement.type];
          const Icon = config.icon;
          
          return (
            <div
              key={announcement.id}
              className="relative flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: `hsl(var(--${config.color}) / 0.2)` }}
              >
                <Icon className={`w-5 h-5 text-${config.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <UltraBadge variant={config.color as any} size="sm">
                    {config.label}
                  </UltraBadge>
                  {announcement.isNew && (
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </div>
                <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                  {announcement.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {announcement.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {announcement.date}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 w-6 h-6 p-0"
                onClick={() => setDismissed([...dismissed, announcement.id])}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </UltraCard>
  );
};

export default Announcements;

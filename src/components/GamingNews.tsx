import React from 'react';
import { Newspaper, Clock, ChevronRight, Flame, Star, Zap } from 'lucide-react';

const newsItems = [
  { title: 'Season 2: Cyber Storm Coming Soon!', tag: 'Update', tagColor: 'text-primary bg-primary/10', time: '2h ago', icon: Zap },
  { title: 'New Ranked Mode Added to Chess & Checkers', tag: 'Feature', tagColor: 'text-success bg-success/10', time: '5h ago', icon: Star },
  { title: 'Weekend Double XP Event This Saturday', tag: 'Event', tagColor: 'text-warning bg-warning/10', time: '8h ago', icon: Flame },
  { title: '5 New Games Added: Ice Slider, Hex Merge & More', tag: 'New', tagColor: 'text-secondary bg-secondary/10', time: '1d ago', icon: Star },
  { title: 'Bug Fixes: Improved Pac-Man Ghost AI', tag: 'Fix', tagColor: 'text-muted-foreground bg-muted', time: '2d ago', icon: Zap },
];

const GamingNews: React.FC = () => (
  <div className="glass-panel rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-5">
      <Newspaper className="w-5 h-5 text-primary" />
      <h3 className="font-display text-lg font-bold">Latest News</h3>
    </div>
    <div className="space-y-3">
      {newsItems.map((item, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <item.icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.tagColor}`}>{item.tag}</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {item.time}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  </div>
);

export default GamingNews;

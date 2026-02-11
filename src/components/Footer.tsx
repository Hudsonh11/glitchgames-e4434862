import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Github, Twitter, Heart } from 'lucide-react';
import ChangelogModal from '@/components/ChangelogModal';

const Footer = () => (
  <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-16">
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-gradient">GLITCH</span>
          </div>
          <p className="text-sm text-muted-foreground">The ultimate free-to-play arcade gaming platform with 50+ games.</p>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm mb-3">Play</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/" className="block hover:text-foreground transition-colors">All Games</Link>
            <Link to="/leaderboard" className="block hover:text-foreground transition-colors">Leaderboard</Link>
            <Link to="/rewards" className="block hover:text-foreground transition-colors">Rewards</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm mb-3">Account</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/profile" className="block hover:text-foreground transition-colors">Profile</Link>
            <Link to="/settings" className="block hover:text-foreground transition-colors">Settings</Link>
            <Link to="/login" className="block hover:text-foreground transition-colors">Login</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm mb-3">More</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <ChangelogModal />
            <p className="text-xs">v2.5.0</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© 2026 Glitch Games. All rights reserved.</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> by the Glitch Team</p>
      </div>
    </div>
  </footer>
);

export default Footer;

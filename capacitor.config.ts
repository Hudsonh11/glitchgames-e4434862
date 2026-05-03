import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f307bed38d1349a8a5ab50f8c5646410',
  appName: 'Glitch Games',
  webDir: 'dist',
  server: {
    url: 'https://f307bed3-8d13-49a8-a5ab-50f8c5646410.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

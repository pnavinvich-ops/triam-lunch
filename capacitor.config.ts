import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'th.ac.tu.triampat.triamlunch',
  appName: 'Triam Lunch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

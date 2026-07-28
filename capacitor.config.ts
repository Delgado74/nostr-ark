import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nostrark.wallet',
  appName: 'NostrArk',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      androidPermissions: ['android.permission.CAMERA'],
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.realtravo.app',
  appName: 'RealTravo',
  webDir: 'dist',
  server: {
    url: 'https://www.realtravo.com',
    cleartext: false
  },
  plugins: {
    Browser: {},
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '',
      forceCodeForRefreshToken: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000'
    }
  },
  android: {
    backgroundColor: '#f4f7f6'
  }
};

export default config;
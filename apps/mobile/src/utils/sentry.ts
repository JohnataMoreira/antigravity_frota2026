import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export const initSentry = () => {
  const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;

  if (sentryDsn && sentryDsn !== '__SENTRY_DSN_PLACEHOLDER__') {
    try {
      Sentry.init({
        dsn: sentryDsn,
        debug: __DEV__,
        environment: __DEV__ ? 'development' : 'production',
        enableAutoSessionTracking: true,
        // Performance Monitoring
        tracesSampleRate: 1.0,
      });
      console.log('[Sentry] Initialized');
    } catch (e) {
      console.warn('[Sentry] Failed to initialize:', e);
    }
  } else {
    console.log('[Sentry] DSN not found or invalid placeholder, skipping initialization');
  }
};

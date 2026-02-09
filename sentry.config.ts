import * as Sentry from '@sentry/react-native';

// Only initialize Sentry if DSN is provided
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in production
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    // Attach screenshots in development for better debugging
    attachScreenshot: __DEV__,
    // Enable native crash reporting
    enableNativeCrashHandling: true,
    // Configure release tracking
    release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    dist: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
    // Organization and project for source map uploads
    organization: 'pantheon-industries',
    project: 'echo',
  });
} else {
  console.warn('Sentry DSN not found. Error tracking will be disabled. Set EXPO_PUBLIC_SENTRY_DSN to enable.');
}

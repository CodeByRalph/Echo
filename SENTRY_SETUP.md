# Sentry Setup

Sentry has been integrated into the Echo app for error tracking and crash reporting.

## Configuration

Sentry is configured in `sentry.config.ts` and initialized at app startup in `app/_layout.tsx`.

## Environment Variables

You need to set the Sentry DSN as an environment variable. You can get this from your Sentry project settings.

### For Development (.env file)

The `.env` file has been configured with your Sentry DSN for local development.

### For Production (EAS Secrets)

✅ **DONE** - The Sentry DSN has been set as an EAS secret for production builds.

The secret `EXPO_PUBLIC_SENTRY_DSN` is configured and will be automatically injected into production builds.

## Features

- **Error Boundary Integration**: All React errors caught by ErrorBoundary are automatically reported to Sentry
- **Service Error Tracking**: Errors from NotificationService, PurchaseService, and Supabase are tracked with tags
- **User Context**: User ID and email are automatically set when a user logs in
- **Crash Reporting**: Native crashes are automatically captured
- **Performance Monitoring**: 10% of transactions are sampled in production (100% in development)

## Getting Your DSN

1. Go to https://sentry.io/organizations/pantheon-industries/projects/echo/
2. Navigate to Settings > Client Keys (DSN)
3. Copy your DSN
4. Add it to your `.env` file or EAS secrets

## Testing

To test Sentry integration, you can manually trigger an error:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.captureMessage('Test error from Echo app', 'info');
```

## Build Configuration

The Sentry Expo plugin is configured in `app.json`. When you build with EAS, Sentry will automatically:
- Upload source maps
- Associate releases with errors
- Track deployment information

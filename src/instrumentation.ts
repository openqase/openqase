import * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      debug: process.env.SENTRY_DEBUG === 'true',
      enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEV === 'true',
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      debug: process.env.SENTRY_DEBUG === 'true',
      enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEV === 'true',
    });
  }
}

// Add the onRequestError hook for Sentry v9.x
export const onRequestError = Sentry.captureRequestError;
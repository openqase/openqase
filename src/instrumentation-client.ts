// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Vercel sets VERCEL_ENV to production | preview | development; NODE_ENV is
  // 'production' for preview builds too, so it cannot distinguish them.
  // Only NEXT_PUBLIC_* vars are inlined into the browser bundle.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  
  // Performance monitoring: sample 10% in production, disabled in development to prevent console noise
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Session replay configuration
  replaysSessionSampleRate: 0, // Only record sessions that hit errors
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  
  // Only enable Sentry error tracking in production (or if explicitly enabled for dev testing)
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_DEV === 'true',

  // Disable debug mode to prevent "Sentry Logger [error]" console noise in development
  debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',
});

// Export required for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
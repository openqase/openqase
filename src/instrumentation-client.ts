// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay configuration
  replaysSessionSampleRate: 0, // Only record sessions that hit errors
  replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors
  
  debug: process.env.NODE_ENV === 'development',
});

// Export required for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Vercel sets VERCEL_ENV to production | preview | development; NODE_ENV is
  // 'production' for preview builds too, so it cannot distinguish them.
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  
  // Profiling (helps identify slow functions)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  
  // Only enable in production or when dev testing is explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEV === 'true',
  
  // Error filtering
  beforeSend(event) {
    // Filter out non-actionable errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError' || error?.type === 'ResizeObserver loop limit exceeded') {
        return null;
      }
    }
    return event;
  },
  
  // Performance monitoring configuration
  beforeSendTransaction(event) {
    // Filter out very fast transactions to reduce noise
    if (event.start_timestamp && event.timestamp) {
      const duration = event.timestamp - event.start_timestamp;
      if (duration < 0.05) return null; // Less than 50ms
    }
    return event;
  },
  
  debug: process.env.SENTRY_DEBUG === 'true',
  
  // Integrations
  integrations: [
    Sentry.httpIntegration(), // Monitors Supabase API calls and external HTTP requests
  ],
});

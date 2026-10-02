import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook. The Sentry SDK does not auto-load the root
 * sentry.*.config.ts files; they must be imported here per runtime, which is
 * the documented @sentry/nextjs setup. Keeping a second inline Sentry.init
 * here previously meant the real server options (error filtering, profiling,
 * HTTP integration) never took effect.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

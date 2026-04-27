#!/usr/bin/env node
/**
 * Pre-build environment assertion.
 *
 * Runs as `npm prebuild` before `next build`. Fails the build if
 * NODE_ENV=production and DEV_MODE_AUTH_BYPASS=true are both set —
 * a combination that would expose admin endpoints without auth in
 * production.
 *
 * This is the primary mechanism for catching the bypass-in-prod
 * misconfiguration. The middleware also has a NODE_ENV gate as
 * runtime defense-in-depth, but build-time failure is preferred:
 * it surfaces the issue before deploy artefacts are produced.
 */

if (
  process.env.NODE_ENV === 'production' &&
  process.env.DEV_MODE_AUTH_BYPASS === 'true'
) {
  console.error(
    'FATAL: DEV_MODE_AUTH_BYPASS=true is set with NODE_ENV=production.\n' +
    'This combination would expose admin endpoints without auth.\n' +
    'Remove DEV_MODE_AUTH_BYPASS from production env vars and redeploy.'
  );
  process.exit(1);
}

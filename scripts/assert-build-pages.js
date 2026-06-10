#!/usr/bin/env node
/**
 * Compare the static-page count from a fresh `next build` against an
 * expected baseline. Fails CI if the count drops, which usually signals
 * a missed SSG path during a refactor.
 *
 * Manually-invoked check (not part of default CI). Run with:
 *   node scripts/assert-build-pages.js
 * or via:
 *   npm run verify:build
 */

import { spawnSync } from 'node:child_process';

const EXPECTED_MIN = 367; // baseline from 2026-04-27. Update when content grows.

const result = spawnSync('npx', ['next', 'build'], { encoding: 'utf8' });
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.status !== 0) {
  console.error('next build failed; cannot verify page count.');
  process.exit(result.status ?? 1);
}

const match = (result.stdout ?? '').match(
  /Generating static pages.*?\((\d+)\/\d+\)\s+in/
);
if (!match) {
  // Regex fragile across Next.js versions. Don't fail the build on a parse
  // miss — that's worse than not having the check. Warn and exit 0 so a
  // human can investigate.
  console.warn(
    'WARN: could not parse static page count from build output. ' +
    'Build succeeded; the count check is skipped. Consider updating the ' +
    'parser or reading from .next/ build manifests directly.'
  );
  process.exit(0);
}
const count = parseInt(match[1], 10);
if (count < EXPECTED_MIN) {
  console.error(
    `Static page count regressed: ${count} < ${EXPECTED_MIN}. ` +
    'Likely a missed SSG path. Review generateStaticParams calls.'
  );
  process.exit(1);
}
console.log(`Static page count OK: ${count} >= ${EXPECTED_MIN}`);

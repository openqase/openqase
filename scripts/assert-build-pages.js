#!/usr/bin/env node
/**
 * Post-build guard: count the statically prerendered routes in
 * .next/prerender-manifest.json and fail if the count collapsed. A database
 * outage at build time otherwise yields a green build with almost no pages.
 *
 * Runs after `next build` (see vercel.json buildCommand, and `npm run
 * verify:build`). Never runs the build itself.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Static routes on 2026-10-01: 340. Floor leaves headroom for content removal
// while catching a collapse. Raise when content grows.
export const EXPECTED_MIN = 300

export function countPrerenderedRoutes(manifest) {
  return Object.keys(manifest?.routes ?? {}).length
}

function main() {
  const strict = process.env.VERCEL_ENV === 'production'
  let manifest
  try {
    manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'))
  } catch (err) {
    const msg = `could not read .next/prerender-manifest.json (${err.message})`
    if (strict) { console.error(`ERROR: ${msg}`); process.exit(1) }
    console.warn(`WARN: ${msg}; page-count check skipped.`)
    process.exit(0)
  }
  const count = countPrerenderedRoutes(manifest)
  if (count < EXPECTED_MIN) {
    const msg = `static page count ${count} is below the floor ${EXPECTED_MIN} — likely a content query failure during the build`
    if (strict) { console.error(`ERROR: ${msg}`); process.exit(1) }
    console.warn(`WARN: ${msg} (not failing outside Vercel production)`)
    process.exit(0)
  }
  console.log(`Static page count OK: ${count} >= ${EXPECTED_MIN}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

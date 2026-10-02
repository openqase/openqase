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

export function evaluate(count, { strict, floor }) {
  if (count < floor) {
    return {
      ok: false,
      fatal: strict,
      message: `static page count ${count} is below the floor ${floor}. If this follows a content query failure, check the build log above. If you removed content on purpose, raise/lower EXPECTED_MIN in scripts/assert-build-pages.mjs or set MIN_STATIC_PAGES for this deploy.`,
    }
  }
  return { ok: true, fatal: false, message: `Static page count OK: ${count} >= ${floor}` }
}

function main() {
  const strict = process.env.VERCEL_ENV === 'production'
  let floor = Number(process.env.MIN_STATIC_PAGES ?? EXPECTED_MIN)
  if (Number.isNaN(floor)) floor = EXPECTED_MIN
  let manifest
  try {
    manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'))
  } catch (err) {
    const msg = `could not read .next/prerender-manifest.json (${err.message})`
    if (strict) { console.error(`ERROR: ${msg}`); process.exit(1) }
    console.warn(`WARN: ${msg}; page-count check skipped.`)
    process.exit(0)
  }
  const result = evaluate(countPrerenderedRoutes(manifest), { strict, floor })
  if (result.ok) {
    console.log(result.message)
  } else if (result.fatal) {
    console.error(`ERROR: ${result.message}`)
    process.exit(1)
  } else {
    console.warn(`WARN: ${result.message} (not failing outside Vercel production)`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('Supabase CLI version is pinned identically in CI and package.json', () => {
  it('uses one exact version string in both places', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { devDependencies: Record<string, string> }
    const ciVersion = ci.match(/supabase\/setup-cli@v1[\s\S]*?version:\s*([\d.]+)/)?.[1]
    expect(ciVersion, 'ci.yml must pin supabase/setup-cli to an exact version').toBeDefined()
    expect(pkg.devDependencies.supabase).toBe(ciVersion)
  })
})

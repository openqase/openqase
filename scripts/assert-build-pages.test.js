import { describe, it, expect } from 'vitest'
import { countPrerenderedRoutes, EXPECTED_MIN } from './assert-build-pages.js'

describe('countPrerenderedRoutes', () => {
  it('counts static routes only, ignoring dynamic route patterns', () => {
    const manifest = {
      routes: { '/': {}, '/about': {}, '/case-study/a': {} },
      dynamicRoutes: { '/case-study/[slug]': {} },
    }
    expect(countPrerenderedRoutes(manifest)).toBe(3)
  })

  it('returns 0 for a manifest with no routes', () => {
    expect(countPrerenderedRoutes({})).toBe(0)
  })

  it('has a floor below the current production count but far above an empty site', () => {
    expect(EXPECTED_MIN).toBeGreaterThan(200)
    expect(EXPECTED_MIN).toBeLessThanOrEqual(340)
  })
})

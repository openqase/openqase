import { describe, it, expect } from 'vitest'
import { countPrerenderedRoutes, evaluate } from './assert-build-pages.mjs'

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

})

describe('evaluate', () => {
  it('is fatal below the floor when strict', () => {
    const r = evaluate(5, { strict: true, floor: 300 })
    expect(r.ok).toBe(false)
    expect(r.fatal).toBe(true)
    expect(r.message).toContain('5')
  })

  it('is a non-fatal warning below the floor when not strict', () => {
    const r = evaluate(5, { strict: false, floor: 300 })
    expect(r.ok).toBe(false)
    expect(r.fatal).toBe(false)
  })

  it('is ok at or above the floor', () => {
    expect(evaluate(300, { strict: true, floor: 300 })).toMatchObject({ ok: true, fatal: false })
    expect(evaluate(340, { strict: true, floor: 300 })).toMatchObject({ ok: true, fatal: false })
  })
})

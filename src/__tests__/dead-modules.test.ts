import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'

/**
 * Modules superseded by src/cms/operations that must not come back.
 * content-management.ts carried a delete-all-then-insert relationship save and
 * a publish toggle that bypassed the single implementation (CLAUDE.md
 * "Deletion System"); cms/actions.ts was an unused duplicate of the admin actions.
 */
const REMOVED = ['src/utils/content-management.ts', 'src/cms/actions.ts']

describe('superseded CMS modules stay deleted', () => {
  for (const file of REMOVED) {
    it(`${file} does not exist`, () => {
      expect(existsSync(file)).toBe(false)
    })
  }
})

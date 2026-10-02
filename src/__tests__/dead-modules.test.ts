import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'

/**
 * Modules that were superseded by src/cms/operations and must not come back:
 * each carried its own delete / relationship-save path that bypassed the
 * single soft-delete and diffing implementation (see CLAUDE.md "Deletion System").
 */
const REMOVED = ['src/utils/content-management.ts', 'src/cms/actions.ts']

describe('superseded CMS modules stay deleted', () => {
  for (const file of REMOVED) {
    it(`${file} does not exist`, () => {
      expect(existsSync(file)).toBe(false)
    })
  }
})

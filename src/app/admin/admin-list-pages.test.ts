// src/app/admin/admin-list-pages.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { contentTypes } from '@/cms/registry'

/**
 * Every admin list page must hide soft-deleted rows; those live in the
 * per-type trash page instead. Soft delete also sets published=false, so a
 * missing filter makes a "deleted" item reappear in the main list as a draft.
 */
describe('admin list pages hide trashed rows', () => {
  for (const ct of contentTypes) {
    it(`${ct.adminPath}/page.tsx filters deleted_at IS NULL`, () => {
      const file = `src/app${ct.adminPath}/page.tsx`
      const src = readFileSync(file, 'utf8')
      expect(src, `${file} is missing .is('deleted_at', null)`).toMatch(/\.is\(\s*'deleted_at'\s*,\s*null\s*\)/)
    })
  }
})

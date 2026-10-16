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

/**
 * The dashboard counts and the relationship pickers on edit pages must not
 * offer trashed rows either. Lookups by id (the item being edited, or the ids
 * it is already linked to) are exempt: those keep existing links intact so a
 * restored item comes back with its relationships.
 */
describe('admin dashboard and pickers hide trashed rows', () => {
  const contentTables = contentTypes.map((ct) => ct.tableName)
  const files = [
    'src/app/admin/page.tsx',
    ...contentTypes.map((ct) => `src/app${ct.adminPath}/[id]/page.tsx`),
  ]

  for (const file of files) {
    it(`${file} filters deleted_at on every content query`, () => {
      const src = readFileSync(file, 'utf8')
      for (const match of src.matchAll(/\.from\(\s*'([a-z_]+)'\s*\)/g)) {
        if (!contentTables.includes(match[1])) continue
        const start = match.index + match[0].length
        const next = src.slice(start).search(/\.from\(|fromTable\(|;/)
        const chain = next === -1 ? src.slice(start) : src.slice(start, start + next)
        if (/\.(eq|in)\(\s*'id'/.test(chain)) continue
        expect(chain, `${file}: .from('${match[1]}') is missing .is('deleted_at', null)`).toMatch(
          /\.is\(\s*'deleted_at'\s*,\s*null\s*\)/,
        )
      }
    })
  }
})

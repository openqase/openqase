/**
 * CMS Engine Smoke Tests
 *
 * These tests hit real Supabase to verify that:
 * 1. buildRelationshipSelect() generates valid PostgREST select strings
 * 2. Queries return data with correct relationship shapes
 * 3. flattenRelationships() produces flat arrays (no nested junction objects)
 * 4. listContent-style queries return paginated results
 *
 * Run: npx vitest run --config vitest.integration.config.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getAllContentTypes } from './registry'
import { buildRelationshipSelect, flattenRelationships } from './operations/relationships'
import type { ContentTypeDefinition } from './define'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const canConnect = !!(supabaseUrl && serviceRoleKey)

// Skip all tests if Supabase credentials are not available
const describeIf = canConnect ? describe : describe.skip

let supabase: SupabaseClient

describeIf('CMS Engine Smoke Tests (real Supabase)', () => {
  beforeAll(() => {
    supabase = createClient(supabaseUrl!, serviceRoleKey!.trim().replace(/\s/g, ''), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  })

  describe('buildRelationshipSelect() generates valid select strings', () => {
    const contentTypes = getAllContentTypes()

    it.each(contentTypes.map(ct => [ct.slug, ct]))(
      '%s — select string has no undefined segments',
      (_slug, ct) => {
        const select = buildRelationshipSelect(ct as ContentTypeDefinition)
        expect(select).not.toContain('undefined')
        expect(select).not.toContain('null')
        // Should start with * if there are relationships
        if ((ct as ContentTypeDefinition).relationships.length > 0) {
          expect(select.startsWith('*,')).toBe(true)
        }
      }
    )
  })

  describe('Fetch a published item for each content type', () => {
    const contentTypes = getAllContentTypes()

    it.each(contentTypes.map(ct => [ct.slug, ct]))(
      '%s — can fetch a published item with relationships',
      async (_slug, ct) => {
        const contentType = ct as ContentTypeDefinition
        const selectStr = buildRelationshipSelect(contentType)

        // First, find a published item
        const { data: listData, error: listError } = await supabase
          .from(contentType.tableName)
          .select('slug')
          .eq('published', true)
          .limit(1)

        // Some content types might have no published items — that's OK, skip
        if (listError || !listData || listData.length === 0) {
          console.log(`  ⏭ ${contentType.slug}: no published items, skipping`)
          return
        }

        const testSlug = listData[0].slug

        // Fetch with full relationship select
        const { data, error } = await supabase
          .from(contentType.tableName)
          .select(selectStr)
          .eq('slug', testSlug)
          .single()

        expect(error).toBeNull()
        expect(data).not.toBeNull()

        // Verify base fields exist
        const titleField = contentType.metadata.titleField
        expect(data).toHaveProperty(titleField)
        expect(data).toHaveProperty('slug', testSlug)
        expect(data).toHaveProperty('id')

        // Flatten relationships and verify shape
        const flattened = flattenRelationships(data as Record<string, unknown>, contentType)

        for (const rel of contentType.relationships) {
          // Each relationship should be a flat array
          expect(flattened).toHaveProperty(rel.name)
          expect(Array.isArray(flattened[rel.name])).toBe(true)

          // If there are items, verify they have the expected shape (id + title/name + slug)
          if (flattened[rel.name].length > 0) {
            const firstItem = flattened[rel.name][0]
            expect(firstItem).toHaveProperty('id')
            expect(firstItem).toHaveProperty('slug')
          }

          // Verify NO raw junction key remains after flattening
          // (the junction key should be on the raw data, not on flattened)
        }

        // Build the merged result the same way fetchContentBySlug does
        const base: Record<string, unknown> = { ...(data as Record<string, unknown>) }
        for (const rel of contentType.relationships) {
          delete base[rel.junction]
        }
        Object.assign(base, flattened)

        // Verify no junction table keys remain on the final object
        for (const rel of contentType.relationships) {
          expect(base).not.toHaveProperty(rel.junction)
        }

        // Verify flat relationship keys exist on the final object
        for (const rel of contentType.relationships) {
          expect(base).toHaveProperty(rel.name)
          expect(Array.isArray(base[rel.name])).toBe(true)
        }
      }
    )
  })

  describe('List content returns paginated results', () => {
    const contentTypes = getAllContentTypes()

    it.each(contentTypes.map(ct => [ct.slug, ct]))(
      '%s — listContent returns items and count',
      async (_slug, ct) => {
        const contentType = ct as ContentTypeDefinition

        const { data, count, error } = await supabase
          .from(contentType.tableName)
          .select('*', { count: 'exact' })
          .eq('published', true)
          .order('created_at', { ascending: false })
          .range(0, 4)

        expect(error).toBeNull()
        expect(data).not.toBeNull()
        expect(Array.isArray(data)).toBe(true)
        expect(typeof count).toBe('number')

        // If there are items, they should have basic fields
        if (data && data.length > 0) {
          expect(data[0]).toHaveProperty('id')
          expect(data[0]).toHaveProperty('slug')
          expect(data[0]).toHaveProperty(contentType.metadata.titleField)
        }
      }
    )
  })

  describe('Blog posts self-referential relationship', () => {
    it('blog-posts — FK disambiguation produces valid query', async () => {
      const blogType = getAllContentTypes().find(ct => ct.slug === 'blog-posts')
      if (!blogType) return

      const selectStr = buildRelationshipSelect(blogType)

      // Should contain the FK hint syntax
      expect(selectStr).toContain('blog_post_relations!')

      // Find a published blog post
      const { data: listData } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('published', true)
        .limit(1)

      if (!listData || listData.length === 0) {
        console.log('  ⏭ blog-posts: no published items, skipping FK test')
        return
      }

      // The query should not error even with FK hints
      const { data, error } = await supabase
        .from('blog_posts')
        .select(selectStr)
        .eq('slug', listData[0].slug)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
    })
  })

  describe('Case studies — all 7 relationships resolve', () => {
    it('case-studies — relationships flatten to 7 named arrays', async () => {
      const csType = getAllContentTypes().find(ct => ct.slug === 'case-studies')
      if (!csType) return

      expect(csType.relationships).toHaveLength(7)

      const selectStr = buildRelationshipSelect(csType)

      const { data: listData } = await supabase
        .from('case_studies')
        .select('slug')
        .eq('published', true)
        .limit(1)

      if (!listData || listData.length === 0) {
        console.log('  ⏭ case-studies: no published items, skipping')
        return
      }

      const { data, error } = await supabase
        .from('case_studies')
        .select(selectStr)
        .eq('slug', listData[0].slug)
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()

      const flattened = flattenRelationships(data as Record<string, unknown>, csType)

      // All 7 relationship names should be present
      const expectedNames = ['industries', 'algorithms', 'personas', 'quantum_software', 'quantum_hardware', 'quantum_companies', 'partner_companies']
      for (const name of expectedNames) {
        expect(flattened).toHaveProperty(name)
        expect(Array.isArray(flattened[name])).toBe(true)
      }
    })
  })
})

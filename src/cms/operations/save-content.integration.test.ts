/**
 * createContent / updateContent / saveRelationships write the row and its
 * junction links through public.save_content_with_relationships in one
 * transaction (#262). A failed link must leave the row and every link
 * unchanged. Runs against the seeded local Supabase via
 * `npm run test:integration`; see src/cms/integration-env.ts.
 *
 * Uses its own fixture rows (unique slugs, deleted in afterAll) and only links
 * them to seeded industries / algorithms, so seeded rows are never modified.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { assertLocalSupabaseEnv } from '@/cms/integration-env'

// revalidatePath needs a Next.js request context; nothing to revalidate here.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createContent } from './create'
import { updateContent } from './update'
import { saveRelationships } from './relationships'
import { getContentType } from '../registry'

// Seeded rows (supabase/seed.sql) used only as link targets.
const IND = [
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000004',
]
const ALG = ['22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002']
// Valid uuid that no row has: inserting a link to it violates the FK.
const MISSING = '00000000-0000-4000-8000-00000000dead'

const RUN = `it262-${Date.now().toString(36)}`
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

let service: SupabaseClient
let anon: SupabaseClient
const createdPersonas: string[] = []
const createdPosts: string[] = []

async function personaRow(id: string) {
  const { data, error } = await service.from('personas').select('*').eq('id', id).single()
  expect(error).toBeNull()
  return data
}

async function links(junction: string, fk: string, tk: string, id: string): Promise<string[]> {
  const { data, error } = await service.from(junction).select(tk).eq(fk, id)
  expect(error).toBeNull()
  return ((data ?? []) as unknown as Record<string, string>[]).map(r => r[tk]).sort()
}

const personaIndustries = (id: string) => links('persona_industry_relations', 'persona_id', 'industry_id', id)
const personaAlgorithms = (id: string) => links('persona_algorithm_relations', 'persona_id', 'algorithm_id', id)

/** Fixture persona linked to IND[0], IND[1] and ALG[0], inserted directly. */
async function makePersona(label: string): Promise<string> {
  const { data, error } = await service
    .from('personas')
    .insert({ name: `IT262 ${label}`, slug: `${RUN}-${label}` })
    .select('id')
    .single()
  expect(error).toBeNull()
  const id = data!.id as string
  createdPersonas.push(id)
  const { error: e1 } = await service.from('persona_industry_relations').insert([
    { persona_id: id, industry_id: IND[0] },
    { persona_id: id, industry_id: IND[1] },
  ])
  const { error: e2 } = await service.from('persona_algorithm_relations').insert({ persona_id: id, algorithm_id: ALG[0] })
  expect(e1).toBeNull()
  expect(e2).toBeNull()
  return id
}

describe('atomic content save (save_content_with_relationships)', () => {
  beforeAll(() => {
    const { url, anonKey, serviceRoleKey } = assertLocalSupabaseEnv(process.env)
    service = createClient(url, serviceRoleKey, clientOptions)
    anon = createClient(url, anonKey, clientOptions)
  })

  afterAll(async () => {
    // Junction rows cascade on delete.
    if (createdPersonas.length) await service.from('personas').delete().in('id', createdPersonas)
    if (createdPosts.length) await service.from('blog_posts').delete().in('id', createdPosts)
    await service.from('personas').delete().like('slug', `${RUN}-%`)
    await service.from('blog_posts').delete().like('slug', `${RUN}-%`)
  })

  it('updateContent: a failed link leaves the row and all links unchanged', async () => {
    const id = await makePersona('upd-fail')
    const before = await personaRow(id)

    const result = await updateContent(
      'personas',
      id,
      { name: 'Changed name', slug: before.slug, description: 'changed' },
      {
        // valid diff (remove IND[0], add IND[2]) is applied first, then rolled back
        industries: [IND[1], IND[2]],
        // FK violation
        algorithms: [ALG[0], MISSING],
      }
    )

    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
    expect(result.error).toContain('algorithms')
    expect(result.error).toMatch(/foreign key/i)

    expect(await personaRow(id)).toEqual(before)
    expect(await personaIndustries(id)).toEqual([IND[0], IND[1]])
    expect(await personaAlgorithms(id)).toEqual([ALG[0]])
  })

  it('updateContent: an invalid id leaves the row and all links unchanged', async () => {
    const id = await makePersona('upd-baduuid')
    const before = await personaRow(id)

    const result = await updateContent('personas', id, { name: 'Changed', slug: before.slug }, { industries: ['not-a-uuid'] })

    expect(result.data).toBeUndefined()
    expect(result.error).toContain('industries')
    expect(await personaRow(id)).toEqual(before)
    expect(await personaIndustries(id)).toEqual([IND[0], IND[1]])
  })

  it('createContent: a failed link creates no row and no links', async () => {
    const slug = `${RUN}-create-fail`
    const { count: linksBefore } = await service
      .from('persona_industry_relations')
      .select('*', { count: 'exact', head: true })

    const result = await createContent(
      'personas',
      { name: 'IT262 create fail', slug },
      { industries: [IND[0]], algorithms: [MISSING] }
    )

    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
    expect(result.error).toMatch(/foreign key/i)

    const { data: rows } = await service.from('personas').select('id').eq('slug', slug)
    expect(rows).toEqual([])
    const { count: linksAfter } = await service
      .from('persona_industry_relations')
      .select('*', { count: 'exact', head: true })
    expect(linksAfter).toBe(linksBefore)
  })

  it('saveRelationships: a failed link leaves every relationship unchanged', async () => {
    const id = await makePersona('rel-fail')
    const personas = getContentType('personas')!

    const result = await saveRelationships(personas, id, { industries: [IND[3]], algorithms: [MISSING] })

    expect(result.error).toMatch(/foreign key/i)
    expect(await personaIndustries(id)).toEqual([IND[0], IND[1]])
    expect(await personaAlgorithms(id)).toEqual([ALG[0]])
  })

  it('applies the row and the link diff together on success (kept links are not re-created)', async () => {
    const id = await makePersona('upd-ok')
    const { data: keptBefore } = await service
      .from('persona_industry_relations')
      .select('id')
      .eq('persona_id', id)
      .eq('industry_id', IND[1])
      .single()

    const result = await updateContent(
      'personas',
      id,
      { name: 'IT262 updated', slug: `${RUN}-upd-ok`, expertise: ['a', 'b'] },
      { industries: [IND[1], IND[2]], algorithms: [] }
    )

    expect(result.error).toBeUndefined()
    expect(result.data).toMatchObject({ id, name: 'IT262 updated', expertise: ['a', 'b'] })
    expect((await personaRow(id)).name).toBe('IT262 updated')
    expect(await personaIndustries(id)).toEqual([IND[1], IND[2]])
    expect(await personaAlgorithms(id)).toEqual([])

    const { data: keptAfter } = await service
      .from('persona_industry_relations')
      .select('id')
      .eq('persona_id', id)
      .eq('industry_id', IND[1])
      .single()
    expect(keptAfter!.id).toBe(keptBefore!.id)
  })

  it('createContent: creates the row and its links together', async () => {
    const slug = `${RUN}-create-ok`
    const result = await createContent('personas', { name: 'IT262 create ok', slug }, { industries: [IND[0], IND[2]] })

    expect(result.error).toBeUndefined()
    const id = result.data!.id as string
    createdPersonas.push(id)
    expect(result.data).toMatchObject({ slug, name: 'IT262 create ok' })
    expect(await personaIndustries(id)).toEqual([IND[0], IND[2]])
    // not sent → untouched (empty for a new row)
    expect(await personaAlgorithms(id)).toEqual([])
  })

  it('blog posts: self-referential related_posts are saved atomically', async () => {
    const a = await createContent('blog-posts', { title: 'IT262 A', slug: `${RUN}-post-a` })
    const b = await createContent('blog-posts', { title: 'IT262 B', slug: `${RUN}-post-b` })
    expect(a.error).toBeUndefined()
    expect(b.error).toBeUndefined()
    const aId = a.data!.id as string
    const bId = b.data!.id as string
    createdPosts.push(aId, bId)

    const ok = await updateContent('blog-posts', aId, { title: 'IT262 A', slug: `${RUN}-post-a` }, { related_posts: [bId] })
    expect(ok.error).toBeUndefined()
    const { data: rel } = await service
      .from('blog_post_relations')
      .select('related_blog_post_id, relation_type')
      .eq('blog_post_id', aId)
    expect(rel).toEqual([{ related_blog_post_id: bId, relation_type: 'related' }])

    const before = (await service.from('blog_posts').select('*').eq('id', aId).single()).data
    const fail = await updateContent(
      'blog-posts',
      aId,
      { title: 'IT262 A changed', slug: `${RUN}-post-a` },
      { related_posts: [MISSING] }
    )
    expect(fail.error).toContain('related_posts')
    expect((await service.from('blog_posts').select('*').eq('id', aId).single()).data).toEqual(before)
    expect(await links('blog_post_relations', 'blog_post_id', 'related_blog_post_id', aId)).toEqual([bId])
  })

  it('rejects junctions and tables that are not on the allow-list', async () => {
    const id = await makePersona('allow-list')
    const before = await personaRow(id)

    const badJunction = await service.rpc('save_content_with_relationships', {
      p_table: 'personas',
      p_id: id,
      p_data: { name: 'nope' },
      p_relationships: [
        { name: 'x', junction: 'algorithm_industry_relations', foreign_key: 'algorithm_id', target_key: 'industry_id', target_ids: [] },
      ],
    })
    expect(badJunction.error?.code).toBe('22023')
    expect(badJunction.error?.message).toMatch(/not allowed/)

    const badTable = await service.rpc('save_content_with_relationships', {
      p_table: 'user_preferences',
      p_data: { role: 'admin' },
    })
    expect(badTable.error?.code).toBe('22023')

    const badColumn = await service.rpc('save_content_with_relationships', {
      p_table: 'personas',
      p_id: id,
      p_data: { 'name = name; --': 'x' },
    })
    expect(badColumn.error?.code).toBe('42703')

    expect(await personaRow(id)).toEqual(before)
    expect(await personaIndustries(id)).toEqual([IND[0], IND[1]])
  })

  it('anon cannot execute save_content_with_relationships', async () => {
    const id = await makePersona('anon')
    const before = await personaRow(id)

    const { data, error } = await anon.rpc('save_content_with_relationships', {
      p_table: 'personas',
      p_id: id,
      p_data: { name: 'anon was here' },
      p_relationships: [],
    })

    expect(data).toBeNull()
    expect(error?.code).toBe('42501')
    expect(error?.message).toBe('permission denied for function save_content_with_relationships')
    expect(await personaRow(id)).toEqual(before)
  })
})

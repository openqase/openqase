import { test, expect, type Page, type Locator, type APIRequestContext } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentTypeDefinition } from '../src/cms/define'
import { adminCredentials, adminDb, E2E_SLUG_PREFIX, getAllContentTypes, getContentType, runId } from './support'

/**
 * Admin CMS smoke test (issue #264), against a local, seeded Supabase.
 *
 * Every row touched here is created by the test itself (slug prefix
 * E2E_SLUG_PREFIX) and removed by the global teardown. Seed rows are only
 * read, and only ever used as relationship targets.
 */

let db: SupabaseClient

test.beforeAll(() => {
  db = adminDb()
})

interface Link {
  junction: string
  foreignKey: string
  targetKey: string
  targetId: string
}

async function firstPublishedId(table: string): Promise<string | null> {
  const { data, error } = await db
    .from(table)
    .select('id')
    .eq('published', true)
    .is('deleted_at', null)
    .order('slug')
    .limit(1)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data?.[0]?.id as string | undefined) ?? null
}

async function linkExists(link: Link, id: string): Promise<boolean> {
  const { data, error } = await db
    .from(link.junction)
    .select(link.foreignKey)
    .eq(link.foreignKey, id)
    .eq(link.targetKey, link.targetId)
  if (error) throw new Error(`${link.junction}: ${error.message}`)
  return (data ?? []).length > 0
}

async function getRow(table: string, id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await db.from(table).select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`${table}: ${error.message}`)
  return data
}

/**
 * Insert a draft of the given type, linked to one published seed row of each
 * related type that has one, so a no-op save also proves relationships are
 * not dropped.
 */
async function createDraftFixture(ct: ContentTypeDefinition) {
  const titleField = ct.metadata.titleField
  const fields = {
    [titleField]: `E2E ${ct.label.singular} ${runId()}`,
    slug: `${E2E_SLUG_PREFIX}${runId()}-${ct.slug}`,
    description: 'Created by the admin e2e smoke test.',
    published: false,
  }
  const { data, error } = await db.from(ct.tableName).insert(fields).select('*').single()
  if (error || !data) throw new Error(`insert ${ct.tableName}: ${error?.message}`)

  const links: Link[] = []
  for (const rel of ct.relationships) {
    // Self-relations (related posts / case studies) need a relation_type.
    if (rel.targetType === ct.slug) continue
    const target = getContentType(rel.targetType)
    if (!target) throw new Error(`unknown relationship target ${rel.targetType}`)
    const targetId = await firstPublishedId(target.tableName)
    if (!targetId) continue
    const { error: linkError } = await db
      .from(rel.junction)
      .insert({ [rel.foreignKey]: data.id, [rel.targetKey]: targetId })
    if (linkError) throw new Error(`link ${rel.junction}: ${linkError.message}`)
    links.push({ junction: rel.junction, foreignKey: rel.foreignKey, targetKey: rel.targetKey, targetId })
  }

  return { row: data as Record<string, unknown>, fields, links }
}

function failOnErrorToast(page: Page) {
  return expect(
    page.getByText(/^(Save Failed|Error|Publish Failed|Unpublish Failed|Saved, but some links were not updated)$/)
  ).toHaveCount(0)
}

test.describe('every content type: open the edit page and save without changes', () => {
  for (const ct of getAllContentTypes()) {
    test(ct.slug, async ({ page }) => {
      const { row, fields, links } = await createDraftFixture(ct)
      const id = row.id as string
      const titleField = ct.metadata.titleField
      const original = fields[titleField] as string

      await page.goto(`${ct.adminPath}/${id}`)
      await streamed(page)
      const titleInput = page.locator(`#${titleField}:visible`)
      await expect(titleInput).toHaveValue(original)

      // Several forms only enable Save once something changed. Type and undo,
      // so the values submitted are exactly what was loaded.
      await titleInput.fill(`${original} (edited)`)
      await titleInput.fill(original)

      const save = page.getByRole('button', { name: 'Save', exact: true })
      await expect(save).toBeEnabled()
      await save.click()
      await expect(page.getByText('Saved', { exact: true }).first()).toBeVisible()
      await failOnErrorToast(page)

      const after = await getRow(ct.tableName, id)
      expect(after, 'row still exists').not.toBeNull()
      expect(after!.updated_at, 'save reached the database').not.toEqual(row.updated_at)
      for (const [key, value] of Object.entries(fields)) {
        expect(after![key], `${key} unchanged by a no-op save`).toEqual(value)
      }
      expect(after!.deleted_at).toBeNull()

      for (const link of links) {
        expect(await linkExists(link, id), `${link.junction} link kept by a no-op save`).toBe(true)
      }
    })
  }
})

/**
 * React streams Suspense content into hidden <div id="S:n"> segments and swaps them
 * in a little after load (reveals are batched), so for a moment the page holds a
 * second, hidden copy of the form. Wait for the swap before using id or
 * placeholder locators, which would otherwise match both copies.
 */
async function streamed(page: Page) {
  await expect(page.locator('div[hidden][id^="S:"]')).toHaveCount(0)
}

/** The RelationshipSelector combobox whose label is `label`. */
function relationshipSelector(page: Page, label: string) {
  return page
    .locator('div.space-y-2')
    .filter({ has: page.locator('div.text-sm.font-medium', { hasText: new RegExp(`^${label}\\*?$`) }) })
    .getByRole('combobox')
}

/** Toggle `itemName` in the selector labelled `label` (select or deselect). */
async function toggleRelationship(page: Page, label: string, itemName: string) {
  await relationshipSelector(page, label).click()
  await page.getByPlaceholder(`Search ${label.toLowerCase()}...`).fill(itemName)
  await page.getByRole('dialog').getByText(itemName, { exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

async function firstPublished(table: string): Promise<{ id: string; name: string }> {
  const { data, error } = await db
    .from(table)
    .select('id, name')
    .eq('published', true)
    .is('deleted_at', null)
    .order('name')
    .limit(1)
    .single()
  if (error || !data) throw new Error(`seed ${table}: ${error?.message ?? 'no published row'}`)
  return data as { id: string; name: string }
}

/**
 * Whether an anonymous visitor sees `text` on `path`. Checked by content, not
 * status: with the root loading.tsx streaming the response, a notFound() slug
 * page is served with HTTP 200 (a soft 404), so the status alone says nothing.
 */
async function publicPageShows(request: APIRequestContext, path: string, text: string): Promise<boolean> {
  const res = await request.get(path, { maxRedirects: 0 })
  return res.status() === 200 && (await res.text()).includes(text)
}

test.describe.serial('case study lifecycle', () => {
  let caseStudyId: string
  let title: string
  let slug: string
  let industry: { id: string; name: string }
  let algorithm: { id: string; name: string }
  let persona: { id: string; name: string }

  // A cookie-less client: what an anonymous visitor sees.
  let anon: APIRequestContext

  test.beforeAll(async ({ playwright, baseURL }) => {
    title = `E2E Lifecycle ${runId()}`
    slug = `${E2E_SLUG_PREFIX}${runId()}-lifecycle`
    industry = await firstPublished('industries')
    algorithm = await firstPublished('algorithms')
    persona = await firstPublished('personas')
    anon = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
  })

  test.afterAll(async () => {
    await anon?.dispose()
  })

  test.beforeEach(async ({ page }) => {
    // confirm() and alert() on the list and trash pages.
    page.on('dialog', dialog => dialog.accept())
  })

  test('create a draft with required relationships', async ({ page }) => {
    await page.goto('/admin/case-studies/new')
    await streamed(page)
    await page.locator('#title:visible').fill(title)
    await page.locator('#slug:visible').fill(slug)
    await page.locator('#description:visible').fill('A draft created by the admin e2e smoke test.')
    await page.locator('#main_content:visible').fill('Body of the e2e smoke-test case study.')
    await toggleRelationship(page, 'Industries', industry.name)
    await toggleRelationship(page, 'Algorithms', algorithm.name)

    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.waitForURL(/\/admin\/case-studies\/[0-9a-f-]{36}$/)
    caseStudyId = page.url().split('/').pop()!

    const row = await getRow('case_studies', caseStudyId)
    expect(row).toMatchObject({ title, slug, published: false, deleted_at: null })
    const industryLink = { junction: 'case_study_industry_relations', foreignKey: 'case_study_id', targetKey: 'industry_id', targetId: industry.id }
    const algorithmLink = { junction: 'algorithm_case_study_relations', foreignKey: 'case_study_id', targetKey: 'algorithm_id', targetId: algorithm.id }
    expect(await linkExists(industryLink, caseStudyId)).toBe(true)
    expect(await linkExists(algorithmLink, caseStudyId)).toBe(true)
  })

  test('link and unlink a relationship', async ({ page }) => {
    const personaLink = { junction: 'case_study_persona_relations', foreignKey: 'case_study_id', targetKey: 'persona_id', targetId: persona.id }
    const industryLink = { junction: 'case_study_industry_relations', foreignKey: 'case_study_id', targetKey: 'industry_id', targetId: industry.id }
    const save = page.getByRole('button', { name: 'Save', exact: true })

    await page.goto(`/admin/case-studies/${caseStudyId}`)
    await streamed(page)
    await expect(page.locator('#title:visible')).toHaveValue(title)

    await toggleRelationship(page, 'Personas', persona.name)
    await save.click()
    await expect(save).toBeDisabled() // isDirty cleared once the save resolved
    await failOnErrorToast(page)
    await expect.poll(() => linkExists(personaLink, caseStudyId)).toBe(true)

    // Reload so the unlink starts from what the server has.
    await page.reload()
    await streamed(page)
    await expect(relationshipSelector(page, 'Personas')).toContainText(persona.name)
    await toggleRelationship(page, 'Personas', persona.name)
    await save.click()
    await expect(save).toBeDisabled()
    await failOnErrorToast(page)
    await expect.poll(() => linkExists(personaLink, caseStudyId)).toBe(false)
    expect(await linkExists(industryLink, caseStudyId), 'other links untouched').toBe(true)
  })

  test('draft is hidden publicly but visible in preview', async ({ page }) => {
    expect(await publicPageShows(anon, `/case-study/${slug}`, title), 'draft not public').toBe(false)

    await page.goto(`/admin/case-studies/${caseStudyId}`)
    await streamed(page)
    const [preview] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Preview', exact: true }).click(),
    ])
    await preview.waitForURL(new RegExp(`/case-study/${slug}$`))
    await expect(preview.getByRole('heading', { name: title }).first()).toBeVisible()
    await preview.close()
    // Draft mode is per browser: anonymous visitors still get the not-found page.
    expect(await publicPageShows(anon, `/case-study/${slug}`, title)).toBe(false)
  })

  test('publish, then unpublish', async ({ page }) => {
    await page.goto(`/admin/case-studies/${caseStudyId}`)
    await streamed(page)
    await expect(page.locator('#title:visible')).toHaveValue(title)

    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Published', exact: true })).toBeVisible()
    await failOnErrorToast(page)
    expect((await getRow('case_studies', caseStudyId))?.published).toBe(true)
    // revalidatePath() on publish must replace the not-found page cached by the draft check.
    await expect.poll(() => publicPageShows(anon, `/case-study/${slug}`, title)).toBe(true)

    await page.getByRole('button', { name: 'Published', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible()
    await failOnErrorToast(page)
    expect((await getRow('case_studies', caseStudyId))?.published).toBe(false)
    await expect.poll(() => publicPageShows(anon, `/case-study/${slug}`, title)).toBe(false)
  })

  /** deleted_at of the case study; throws if the row is gone. */
  async function deletedAt(id: string): Promise<unknown> {
    const row = await getRow('case_studies', id)
    if (!row) throw new Error(`case study ${id} no longer exists`)
    return row.deleted_at
  }

  // List and trash actions end in alert() + window.location.reload(); wait for that
  // reload to finish so the next navigation does not race it (net::ERR_ABORTED).
  async function clickAndWaitForReload(page: Page, button: Locator) {
    const reloaded = page.waitForEvent('framenavigated', { predicate: f => f === page.mainFrame() })
    await button.click()
    await reloaded
    await page.waitForLoadState('load')
    await streamed(page)
  }

  async function deleteFromList(page: Page) {
    await page.goto('/admin/case-studies')
    await streamed(page)
    await page.getByPlaceholder('Search case studies...').fill(title)
    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toHaveCount(1)
    await clickAndWaitForReload(page, row.getByRole('button', { name: 'Delete', exact: true }))
    await expect.poll(() => deletedAt(caseStudyId)).not.toBeNull()
  }

  test('delete, then restore from trash', async ({ page }) => {
    await deleteFromList(page)
    const deleted = await getRow('case_studies', caseStudyId)
    expect(deleted).toMatchObject({ published: false })

    await page.goto('/admin/case-studies/trash')
    await streamed(page)
    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toHaveCount(1)
    await expect(row, 'trash shows who deleted it').toContainText(adminCredentials().email)
    await clickAndWaitForReload(page, row.getByRole('button', { name: 'Restore' }))
    await expect.poll(() => deletedAt(caseStudyId)).toBeNull()
    expect(await getRow('case_studies', caseStudyId)).toMatchObject({ published: false })

    await page.goto('/admin/case-studies')
    await streamed(page)
    await page.getByPlaceholder('Search case studies...').fill(title)
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(1)
  })

  test('permanently delete from trash', async ({ page }) => {
    await deleteFromList(page)

    await page.goto('/admin/case-studies/trash')
    await streamed(page)
    const row = page.getByRole('row').filter({ hasText: title })
    await clickAndWaitForReload(page, row.getByRole('button', { name: 'Delete Forever' }))
    await expect.poll(() => getRow('case_studies', caseStudyId)).toBeNull()

    const industryLink = { junction: 'case_study_industry_relations', foreignKey: 'case_study_id', targetKey: 'industry_id', targetId: industry.id }
    expect(await linkExists(industryLink, caseStudyId), 'junction rows removed with the case study').toBe(false)
    await page.reload()
    await streamed(page)
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0)
  })
})

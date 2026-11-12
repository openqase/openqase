import crypto from 'node:crypto'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createContent } from '@/cms/operations'

const MAX_SLUG_ATTEMPTS = 20

/**
 * Create an unpublished case study draft from an external tool (the
 * openqase-scraper review UI). Machine-to-machine, so it is exempt from the
 * proxy's session/Origin check and authenticates with a bearer token instead.
 * Disabled (503) unless SCRAPER_API_TOKEN is set. Drafts are never published
 * here: a maintainer finishes and publishes them in the admin CMS.
 */
const draftSchema = z.object({
  title: z.string().trim().min(1).max(300),
  year: z.number().int().min(1900).max(2100),
  description: z.string().max(1000).optional(),
  main_content: z.string().max(50000).optional(),
  source_url: z.string().url().optional(),
})

function hasValidToken(header: string | null, expected: string): boolean {
  const given = Buffer.from(header?.replace(/^Bearer\s+/i, '') ?? '')
  const valid = Buffer.from(expected)
  return given.length === valid.length && crypto.timingSafeEqual(given, valid)
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '')
  return slug || 'case-study'
}

export async function POST(request: NextRequest) {
  const expected = process.env.SCRAPER_API_TOKEN
  if (!expected) return NextResponse.json({ error: 'Draft endpoint is disabled' }, { status: 503 })
  if (!hasValidToken(request.headers.get('authorization'), expected)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const parsed = draftSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { source_url, ...fields } = parsed.data

  // `published` is never passed: the column defaults to false, so this is always a draft.
  // Slugs are unique across all rows (trashed ones too): on a clash, retry with -2, -3, ...
  const base = slugify(fields.title)
  let result: Awaited<ReturnType<typeof createContent>> = {}
  for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n++) {
    result = await createContent('case-studies', {
      ...fields,
      slug: n === 1 ? base : `${base}-${n}`,
      academic_references: source_url ? `- ${source_url}` : undefined,
    })
    if (!result.error?.includes('duplicate key')) break
  }
  if (result.error || !result.data) {
    console.error('Error creating case study draft:', result.error)
    const conflict = result.error?.includes('duplicate key')
    return NextResponse.json({ error: 'Failed to create draft' }, { status: conflict ? 409 : 500 })
  }

  const { id, slug } = result.data as { id: string; slug: string }
  return NextResponse.json({ id, slug, admin_url: `/admin/case-studies/${id}` }, { status: 201 })
}

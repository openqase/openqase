import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { BulkActionSchema } from '@/lib/schemas/bulk-action'
import { getContentType } from '@/cms/registry'
import { restoreContent, permanentlyDeleteContent } from '@/cms/operations'
import type { JunctionRef } from '@/cms/operations/delete'

// ---------------------------------------------------------------------------
// Shared handlers for the trash API routes:
//   POST /api/<type>/restore           { id } | { ids }
//   POST /api/<type>/permanent-delete  { id } | { ids }
//
// Each per-type route file is a one-liner that binds the content-type slug.
// The slug is checked against the CMS registry allow-list on every request
// (after the admin check), so an unknown type can never reach the operations.
// ---------------------------------------------------------------------------

type RouteHandler = (request: NextRequest) => Promise<NextResponse | Response>

async function parseIds(request: NextRequest): Promise<
  { ids: string[]; error: null } | { ids: null; error: NextResponse }
> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { ids: null, error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  }
  const parsed = BulkActionSchema.safeParse(body)
  if (!parsed.success) {
    return {
      ids: null,
      error: NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      ),
    }
  }
  const { id, ids } = parsed.data
  return { ids: ids || (id ? [id] : []), error: null }
}

function unknownType(typeSlug: string): NextResponse {
  return NextResponse.json({ error: `Unknown content type: ${typeSlug}` }, { status: 400 })
}

/**
 * Restore items from the trash. Uses the shared CMS restore path: clears
 * deleted_at / deleted_by, keeps published=false (restored items are drafts),
 * restores junction rows, writes the audit log and revalidates.
 */
export function createRestoreHandler(typeSlug: string): RouteHandler {
  return async function POST(request: NextRequest) {
    try {
      const auth = await requireAdmin()
      if (auth.error) return auth.error

      const ct = getContentType(typeSlug)
      if (!ct) return unknownType(typeSlug)

      const { ids, error } = await parseIds(request)
      if (error) return error

      const failed: string[] = []
      for (const contentId of ids) {
        const result = await restoreContent(ct.slug, contentId, { restoredBy: auth.user.id })
        if (!result.success) {
          console.error(`Restore error for ${ct.label.singular} ${contentId}:`, result.error)
          failed.push(contentId)
        }
      }

      if (failed.length > 0) {
        return NextResponse.json(
          { error: `Failed to restore ${ct.label.plural.toLowerCase()}: ${failed.join(', ')}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, restored: ids.length })
    } catch (error) {
      console.error('Restore error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Permanently delete items from the trash ("empty trash" flow). Only rows
 * that are already soft-deleted are removed; live content can't be
 * hard-deleted through here. Junction rows (registry junctions plus any
 * `extraJunctions`) are removed first, then pages are revalidated.
 */
export function createPermanentDeleteHandler(
  typeSlug: string,
  extraJunctions: JunctionRef[] = []
): RouteHandler {
  return async function POST(request: NextRequest) {
    try {
      const auth = await requireAdmin()
      if (auth.error) return auth.error

      const ct = getContentType(typeSlug)
      if (!ct) return unknownType(typeSlug)

      const { ids, error } = await parseIds(request)
      if (error) return error

      const result = await permanentlyDeleteContent(ct.slug, ids, extraJunctions)

      if (!result.success) {
        console.error('Permanent delete error:', result.error)
        return NextResponse.json(
          { error: `Failed to permanently delete ${ct.label.plural.toLowerCase()}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, deleted: result.deleted })
    } catch (error) {
      console.error('Permanent delete error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

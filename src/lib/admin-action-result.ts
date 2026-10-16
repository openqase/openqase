/**
 * Result contract for the admin editor server actions in
 * src/app/admin/<type>/[id]/actions.ts.
 *
 * Actions return failures instead of throwing. In production Next.js replaces
 * the message of an error thrown from a server action with a generic one, so
 * a thrown "slug already exists" or "cannot publish a trashed item" never
 * reaches the editor.
 *
 * `warning` means the row was written but something secondary failed (for
 * example a relationship link). `data` is still returned in that case so the
 * editor keeps the new row's id: a retry then updates the row instead of
 * inserting it again and colliding on the slug.
 *
 * Auth failures are the exception: withAdmin() still throws before the action
 * runs.
 */

export type ActionFailure = { success: false; error: string }

/** Result of an action that returns no data (publish, unpublish, spec save). */
export type ActionResult = { success: true } | ActionFailure

/** Result of a save action: the written row, plus any non-fatal warning. */
export type SaveActionResult<T> =
  | { success: true; data: T; warning?: string }
  | ActionFailure

/** Shape returned by createContent() / updateContent() in src/cms/operations. */
interface ContentWriteResult {
  data?: Record<string, unknown>
  error?: string
  warning?: string
}

/**
 * Converts a createContent()/updateContent() result into a SaveActionResult.
 * `error` means the row was not written; `warning` means it was.
 */
export function toSaveResult<T>(result: ContentWriteResult): SaveActionResult<T> {
  if (result.error) return { success: false, error: result.error }
  if (!result.data) return { success: false, error: 'Save did not return the saved item' }
  return result.warning
    ? { success: true, data: result.data as T, warning: result.warning }
    : { success: true, data: result.data as T }
}

/** Converts a publishContent()/unpublishContent() result into an ActionResult. */
export function toActionResult(
  result: { success: boolean; error?: string },
  fallbackError: string
): ActionResult {
  return result.success ? { success: true } : { success: false, error: result.error || fallbackError }
}

/**
 * Runs an action body and turns anything it throws into an ActionFailure, so
 * unexpected errors reach the editor as a message rather than a redacted throw.
 */
export async function runAction<R>(
  fallbackError: string,
  action: () => Promise<R>
): Promise<R | ActionFailure> {
  try {
    return await action()
  } catch (error: unknown) {
    console.error(`[admin action] ${fallbackError}:`, error)
    const message = error instanceof Error && error.message ? error.message : fallbackError
    return { success: false, error: message }
  }
}

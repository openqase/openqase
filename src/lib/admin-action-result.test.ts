import { describe, it, expect, vi } from 'vitest'
import { toSaveResult, toActionResult, runAction } from './admin-action-result'

describe('toSaveResult', () => {
  it('returns the row on success', () => {
    expect(toSaveResult({ data: { id: 'a' } })).toEqual({ success: true, data: { id: 'a' } })
  })

  it('keeps the row alongside a warning, so a new id is not lost', () => {
    const result = toSaveResult<{ id: string }>({ data: { id: 'a' }, warning: 'links failed' })
    expect(result).toEqual({ success: true, data: { id: 'a' }, warning: 'links failed' })
  })

  it('returns a failure when the row was not written', () => {
    expect(toSaveResult({ error: 'duplicate slug' })).toEqual({ success: false, error: 'duplicate slug' })
  })

  it('returns a failure when there is neither data nor error', () => {
    expect(toSaveResult({})).toEqual({ success: false, error: expect.any(String) })
  })
})

describe('toActionResult', () => {
  it('maps success', () => {
    expect(toActionResult({ success: true }, 'x')).toEqual({ success: true })
  })

  it('passes the error through, or the fallback when there is none', () => {
    expect(toActionResult({ success: false, error: 'trashed' }, 'x')).toEqual({ success: false, error: 'trashed' })
    expect(toActionResult({ success: false }, 'Failed to publish')).toEqual({ success: false, error: 'Failed to publish' })
  })
})

describe('runAction', () => {
  it('returns the action result', async () => {
    await expect(runAction('x', async () => ({ success: true as const }))).resolves.toEqual({ success: true })
  })

  it('turns a thrown error into a failure with its message', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(runAction('Failed to save', async () => { throw new Error('boom') })).resolves.toEqual({
      success: false,
      error: 'boom',
    })
    await expect(runAction('Failed to save', async () => { throw 'not an error' })).resolves.toEqual({
      success: false,
      error: 'Failed to save',
    })
    spy.mockRestore()
  })
})

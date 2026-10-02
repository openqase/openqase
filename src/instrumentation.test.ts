// src/instrumentation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const init = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  init: (...args: unknown[]) => init(...args),
  httpIntegration: () => ({ name: 'Http' }),
  captureRequestError: vi.fn(),
}))

const ORIGINAL_RUNTIME = process.env.NEXT_RUNTIME

describe('instrumentation.register', () => {
  beforeEach(() => {
    vi.resetModules()
    init.mockClear()
  })
  afterEach(() => {
    if (ORIGINAL_RUNTIME === undefined) delete process.env.NEXT_RUNTIME
    else process.env.NEXT_RUNTIME = ORIGINAL_RUNTIME
  })

  it('loads the full server config (with the beforeSend filter) for the nodejs runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    const { register } = await import('./instrumentation')
    await register()
    expect(init).toHaveBeenCalledTimes(1)
    const options = init.mock.calls[0][0] as Record<string, unknown>
    expect(typeof options.beforeSend).toBe('function')
    expect(typeof options.beforeSendTransaction).toBe('function')
    expect(Array.isArray(options.integrations)).toBe(true)
  })

  it('loads the edge config (no beforeSend) for the edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    const { register } = await import('./instrumentation')
    await register()
    expect(init).toHaveBeenCalledTimes(1)
    const options = init.mock.calls[0][0] as Record<string, unknown>
    expect(options.beforeSend).toBeUndefined()
  })

  it('does nothing for an unknown runtime', async () => {
    delete process.env.NEXT_RUNTIME
    const { register } = await import('./instrumentation')
    await register()
    expect(init).not.toHaveBeenCalled()
  })
})

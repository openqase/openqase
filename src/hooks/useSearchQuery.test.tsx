// src/hooks/useSearchQuery.test.tsx
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { useSearchQuery } from './useSearchQuery'

function Probe({ initial }: { initial?: string }) {
  const { query, deferredQuery, isPending } = useSearchQuery(initial)
  return <output data-q={query} data-d={deferredQuery} data-p={String(isPending)} />
}

describe('useSearchQuery', () => {
  it('starts with the initial value, deferred value equal to it, and not pending', () => {
    const html = renderToStaticMarkup(<Probe initial="qaoa" />)
    expect(html).toContain('data-q="qaoa"')
    expect(html).toContain('data-d="qaoa"')
    expect(html).toContain('data-p="false"')
  })

  it('defaults to an empty query', () => {
    const html = renderToStaticMarkup(<Probe />)
    expect(html).toContain('data-q=""')
    expect(html).toContain('data-p="false"')
  })
})

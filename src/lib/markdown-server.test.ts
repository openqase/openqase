import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock React's cache to be a pass-through
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}))

// Reset markdown-it singleton between tests by clearing module cache
beforeEach(() => {
  vi.resetModules()
})

async function getModule() {
  // Re-import to get fresh module (after resetModules)
  return await import('./markdown-server')
}

describe('preprocessMarkdown', () => {
  it('adds space after dash when missing', async () => {
    const { preprocessMarkdown } = await getModule()
    expect(preprocessMarkdown('-item')).toBe('- item')
  })

  it('preserves dashes with existing spaces', async () => {
    const { preprocessMarkdown } = await getModule()
    expect(preprocessMarkdown('- item')).toBe('- item')
  })

  it('fixes multiple bullets', async () => {
    const { preprocessMarkdown } = await getModule()
    const input = '-one\n-two\n-three'
    const result = preprocessMarkdown(input)
    expect(result).toContain('- one')
    expect(result).toContain('- two')
    expect(result).toContain('- three')
  })
})

describe('processMarkdown', () => {
  it('renders basic markdown to HTML', async () => {
    const { processMarkdown } = await getModule()
    const result = processMarkdown('**bold** text')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('text')
  })

  it('returns empty string for null input', async () => {
    const { processMarkdown } = await getModule()
    expect(processMarkdown(null)).toBe('')
  })

  it('returns empty string for undefined input', async () => {
    const { processMarkdown } = await getModule()
    expect(processMarkdown(undefined)).toBe('')
  })

  it('returns empty string for empty string input', async () => {
    const { processMarkdown } = await getModule()
    expect(processMarkdown('')).toBe('')
  })

  it('wraps tables in a container div', async () => {
    const { processMarkdown } = await getModule()
    const table = '| A | B |\n| - | - |\n| 1 | 2 |'
    const result = processMarkdown(table)
    expect(result).toContain('<div class="table-container">')
    expect(result).toContain('</table></div>')
  })

  it('adds numeric class to numeric table cells', async () => {
    const { processMarkdown } = await getModule()
    const table = '| Name | Value |\n| - | - |\n| test | 42 |'
    const result = processMarkdown(table)
    expect(result).toContain('<td class="numeric">')
  })

  it('passes through raw HTML', async () => {
    const { processMarkdown } = await getModule()
    const html = '<div class="custom">Hello</div>'
    const result = processMarkdown(html)
    expect(result).toContain('<div class="custom">Hello</div>')
  })

  it('converts links with linkify', async () => {
    const { processMarkdown } = await getModule()
    const result = processMarkdown('Visit https://example.com today')
    expect(result).toContain('<a href="https://example.com"')
  })

  it('renders headers', async () => {
    const { processMarkdown } = await getModule()
    const result = processMarkdown('# Title\n\n## Subtitle')
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<h2>Subtitle</h2>')
  })
})

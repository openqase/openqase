import { describe, it, expect } from 'vitest'
import { findUSSpellings, replaceUSSpellings } from './spelling-patterns'

describe('findUSSpellings', () => {
  it('detects -ize words', () => {
    const results = findUSSpellings('We need to optimize performance.')
    expect(results).toHaveLength(1)
    expect(results[0].usSpelling).toBe('optimize')
    expect(results[0].ukSpelling).toBe('optimise')
    expect(results[0].category).toBe('ize-ise')
  })

  it('detects -or words', () => {
    const results = findUSSpellings('The color of the behavior model.')
    expect(results).toHaveLength(2)
    const usSpellings = results.map((r) => r.usSpelling)
    expect(usSpellings).toContain('color')
    expect(usSpellings).toContain('behavior')
  })

  it('detects -er words', () => {
    const results = findUSSpellings('The data center uses fiber cables.')
    expect(results).toHaveLength(2)
    const usSpellings = results.map((r) => r.usSpelling)
    expect(usSpellings).toContain('center')
    expect(usSpellings).toContain('fiber')
  })

  it('detects -se words', () => {
    const results = findUSSpellings('The defense requires a license.')
    expect(results).toHaveLength(2)
    const usSpellings = results.map((r) => r.usSpelling)
    expect(usSpellings).toContain('defense')
    expect(usSpellings).toContain('license')
  })

  it('detects -og words', () => {
    const results = findUSSpellings('Check the catalog and dialog box.')
    expect(results).toHaveLength(2)
    const usSpellings = results.map((r) => r.usSpelling)
    expect(usSpellings).toContain('catalog')
    expect(usSpellings).toContain('dialog')
  })

  it('detects single-l words', () => {
    const results = findUSSpellings('Traveling and modeling are common.')
    expect(results).toHaveLength(2)
    const usSpellings = results.map((r) => r.usSpelling)
    expect(usSpellings).toContain('traveling')
    expect(usSpellings).toContain('modeling')
  })

  it('is case-insensitive', () => {
    const results = findUSSpellings('Optimize and OPTIMIZE are both found.')
    expect(results).toHaveLength(1)
    expect(results[0].matches).toHaveLength(2)
  })

  it('returns empty array for clean UK text', () => {
    const results = findUSSpellings('We need to optimise performance and add colour.')
    expect(results).toHaveLength(0)
  })

  it('detects multiple occurrences', () => {
    const results = findUSSpellings('optimize and then optimize again')
    expect(results).toHaveLength(1)
    expect(results[0].matches).toContain('optimize')
  })

  it('returns empty for empty string', () => {
    expect(findUSSpellings('')).toHaveLength(0)
  })
})

describe('replaceUSSpellings', () => {
  it('replaces -ize with -ise', () => {
    expect(replaceUSSpellings('We optimize and analyze data.')).toBe(
      'We optimise and analyse data.'
    )
  })

  it('replaces -or with -our', () => {
    expect(replaceUSSpellings('The color of behavior.')).toBe(
      'The colour of behaviour.'
    )
  })

  it('replaces -er with -re', () => {
    expect(replaceUSSpellings('The center fiber.')).toBe('The centre fibre.')
  })

  it('replaces -se with -ce', () => {
    expect(replaceUSSpellings('defense license')).toBe('defence licence')
  })

  it('replaces -og with -ogue', () => {
    expect(replaceUSSpellings('catalog dialog')).toBe('catalogue dialogue')
  })

  it('replaces single-l with double-l', () => {
    expect(replaceUSSpellings('traveling modeling')).toBe('travelling modelling')
  })

  it('leaves clean UK text unchanged', () => {
    const ukText = 'We optimise and analyse data at the centre.'
    expect(replaceUSSpellings(ukText)).toBe(ukText)
  })

  it('handles empty string', () => {
    expect(replaceUSSpellings('')).toBe('')
  })
})

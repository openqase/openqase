import { describe, it, expect } from 'vitest'
import {
  validateContent,
  groupIssuesBySeverity,
  groupIssuesByField,
  hasBlockingErrors,
  getValidationSummary,
} from './content-validation'

describe('validateContent', () => {
  it('detects missing required fields', () => {
    const issues = validateContent({})
    const required = issues.filter((i) => i.type === 'required')
    expect(required.length).toBeGreaterThanOrEqual(2)
    const fields = required.map((i) => i.field)
    expect(fields).toContain('title')
    expect(fields).toContain('description')
  })

  it('skips required check when disabled', () => {
    const issues = validateContent({}, { checkRequiredFields: false })
    const required = issues.filter((i) => i.type === 'required')
    expect(required).toHaveLength(0)
  })

  it('detects US spellings in title', () => {
    const issues = validateContent({
      title: 'Color Analysis of Fiber Networks',
      description: 'A proper description that is long enough for validation.',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const spellingIssues = issues.filter(
      (i) => i.type === 'us-spelling' && i.field === 'title'
    )
    // "color" and "fiber" are not quantum terms, so both should be detected
    expect(spellingIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('detects US spellings in description', () => {
    const issues = validateContent({
      title: 'A Valid Title Here',
      description: 'The behavior of the defense system is important.',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const spellingIssues = issues.filter(
      (i) => i.type === 'us-spelling' && i.field === 'description'
    )
    expect(spellingIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('detects US spellings in main_content', () => {
    const issues = validateContent({
      title: 'A Valid Title Here',
      description: 'A proper description that is long enough for the validation check.',
      main_content: 'We need to analyze the center of the traveling modeling data to improve results.',
    })
    const spellingIssues = issues.filter(
      (i) => i.type === 'us-spelling' && i.field === 'main_content'
    )
    expect(spellingIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('skips US spelling check when disabled', () => {
    const issues = validateContent(
      {
        title: 'Color Analysis',
        description: 'A proper description that is long enough for validation.',
        main_content: 'Some content that is long enough to pass quality checks easily for testing.',
      },
      { checkUSSpellings: false }
    )
    const spellingIssues = issues.filter((i) => i.type === 'us-spelling')
    expect(spellingIssues).toHaveLength(0)
  })

  it('filters out quantum terms from spelling matches', () => {
    // "optimization" is in the quantum dictionary, so it should be filtered out
    const issues = validateContent({
      title: 'Quantum Optimization Research Title',
      description: 'A proper description that is long enough for the validation check.',
      main_content: 'Quantum optimization is a key area of research with broad applications.',
    })
    const optimizeSpellings = issues.filter(
      (i) => i.type === 'us-spelling' && i.suggestion === 'optimisation'
    )
    expect(optimizeSpellings).toHaveLength(0)
  })

  it('warns about short titles', () => {
    const issues = validateContent({
      title: 'Short',
      description: 'A proper description that is long enough for the validation check.',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const qualityIssues = issues.filter(
      (i) => i.type === 'quality' && i.field === 'title'
    )
    expect(qualityIssues).toHaveLength(1)
  })

  it('warns about short descriptions', () => {
    const issues = validateContent({
      title: 'A Long Enough Title',
      description: 'Too short.',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const qualityIssues = issues.filter(
      (i) => i.type === 'quality' && i.field === 'description'
    )
    expect(qualityIssues).toHaveLength(1)
  })

  it('warns about short content', () => {
    const issues = validateContent({
      title: 'A Long Enough Title',
      description: 'A proper description that is long enough for the validation check.',
      main_content: 'Short.',
    })
    const qualityIssues = issues.filter(
      (i) => i.type === 'quality' && i.field === 'main_content'
    )
    expect(qualityIssues).toHaveLength(1)
  })

  it('skips quality checks when disabled', () => {
    const issues = validateContent(
      { title: 'X', description: 'Y.', main_content: 'Z.' },
      { checkQuality: false }
    )
    const qualityIssues = issues.filter((i) => i.type === 'quality' || i.type === 'style')
    expect(qualityIssues).toHaveLength(0)
  })

  it('warns about title ending with period', () => {
    const issues = validateContent({
      title: 'A Title That Ends With Period.',
      description: 'A proper description that is long enough for the validation check.',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const styleIssues = issues.filter(
      (i) => i.type === 'style' && i.field === 'title' && i.message.includes('full stop')
    )
    expect(styleIssues).toHaveLength(1)
  })

  it('warns about ALL CAPS titles', () => {
    const issues = validateContent({
      title: 'THIS IS AN ALL CAPS TITLE',
      description: 'A proper description that is long enough for the validation check.',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const capsIssues = issues.filter(
      (i) => i.type === 'style' && i.message.includes('ALL CAPS')
    )
    expect(capsIssues).toHaveLength(1)
  })

  it('warns about description not ending with punctuation', () => {
    const issues = validateContent({
      title: 'A Long Enough Title',
      description: 'A proper description that is long enough but has no ending punctuation',
      main_content: 'Some content that is long enough to pass quality checks easily for testing.',
    })
    const styleIssues = issues.filter(
      (i) => i.type === 'style' && i.field === 'description'
    )
    expect(styleIssues).toHaveLength(1)
  })

  it('respects custom minLength options', () => {
    const issues = validateContent(
      {
        title: 'OK Title For This Test',
        description: 'Short.',
        main_content: 'Short.',
      },
      { minDescriptionLength: 5, minContentLength: 5 }
    )
    const qualityIssues = issues.filter(
      (i) => i.type === 'quality' && (i.field === 'description' || i.field === 'main_content')
    )
    expect(qualityIssues).toHaveLength(0)
  })

  it('uses "content" field name for blog posts', () => {
    const issues = validateContent({
      title: 'A Long Enough Title',
      description: 'A proper description that is long enough for the validation check.',
      content: 'We analyze the center of the data to improve results significantly.',
    })
    const spellingIssues = issues.filter(
      (i) => i.type === 'us-spelling' && i.field === 'content'
    )
    expect(spellingIssues.length).toBeGreaterThanOrEqual(1)
  })
})

describe('groupIssuesBySeverity', () => {
  it('groups issues correctly', () => {
    const issues = validateContent({})
    const grouped = groupIssuesBySeverity(issues)
    expect(grouped).toHaveProperty('errors')
    expect(grouped).toHaveProperty('warnings')
    expect(grouped).toHaveProperty('info')
    expect(grouped.errors.length).toBeGreaterThan(0)
  })
})

describe('groupIssuesByField', () => {
  it('groups issues by field name', () => {
    const issues = validateContent({})
    const grouped = groupIssuesByField(issues)
    expect(grouped).toHaveProperty('title')
    expect(grouped).toHaveProperty('description')
  })
})

describe('hasBlockingErrors', () => {
  it('returns true when there are errors', () => {
    const issues = validateContent({})
    expect(hasBlockingErrors(issues)).toBe(true)
  })

  it('returns false when there are only warnings', () => {
    const issues = validateContent(
      {
        title: 'Short',
        description: 'Short.',
        main_content: 'Some content that is long enough to pass all validation checks.',
      },
      { checkRequiredFields: false }
    )
    // Filter to only warnings/info
    const nonErrors = issues.filter((i) => i.severity !== 'error')
    expect(hasBlockingErrors(nonErrors)).toBe(false)
  })
})

describe('getValidationSummary', () => {
  it('returns correct summary', () => {
    const issues = validateContent({})
    const summary = getValidationSummary(issues)
    expect(summary.total).toBe(issues.length)
    expect(summary.errors).toBeGreaterThan(0)
    expect(summary.isValid).toBe(false)
  })

  it('returns isValid true when no errors', () => {
    const summary = getValidationSummary([])
    expect(summary.isValid).toBe(true)
    expect(summary.total).toBe(0)
  })
})

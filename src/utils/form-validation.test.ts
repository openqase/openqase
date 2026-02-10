import { describe, it, expect } from 'vitest'
import {
  validators,
  validateFormValues,
  calculateCompletionPercentage,
  isTabComplete,
  createContentValidationRules,
} from './form-validation'

// --- validators ---

describe('validators.required', () => {
  it('rejects empty string', () => {
    expect(validators.required('')).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    expect(validators.required('   ')).toBe(false)
  })

  it('accepts non-empty string', () => {
    expect(validators.required('hello')).toBe(true)
  })

  it('rejects empty array', () => {
    expect(validators.required([])).toBe(false)
  })

  it('accepts non-empty array', () => {
    expect(validators.required(['a'])).toBe(true)
  })

  it('rejects null and undefined', () => {
    expect(validators.required(null)).toBe(false)
    expect(validators.required(undefined)).toBe(false)
  })

  it('accepts zero as a valid number', () => {
    expect(validators.required(0)).toBe(true)
  })

  it('accepts other numbers', () => {
    expect(validators.required(1)).toBe(true)
    expect(validators.required(-1)).toBe(true)
  })

  it('rejects NaN', () => {
    expect(validators.required(NaN)).toBe(false)
  })

  it('rejects false', () => {
    expect(validators.required(false)).toBe(false)
  })
})

describe('validators.isSlug', () => {
  it('accepts valid slugs', () => {
    expect(validators.isSlug('hello-world')).toBe(true)
    expect(validators.isSlug('a')).toBe(true)
    expect(validators.isSlug('hello-world-123')).toBe(true)
    expect(validators.isSlug('abc123')).toBe(true)
  })

  it('rejects invalid slugs', () => {
    expect(validators.isSlug('Hello-World')).toBe(false)
    expect(validators.isSlug('hello world')).toBe(false)
    expect(validators.isSlug('hello_world')).toBe(false)
    expect(validators.isSlug('')).toBe(false)
    expect(validators.isSlug('-leading')).toBe(false)
    expect(validators.isSlug('trailing-')).toBe(false)
    expect(validators.isSlug('double--dash')).toBe(false)
  })

  it('rejects non-string', () => {
    expect(validators.isSlug(123 as any)).toBe(false)
  })
})

describe('validators.isEmail', () => {
  it('accepts valid emails', () => {
    expect(validators.isEmail('user@example.com')).toBe(true)
    expect(validators.isEmail('user+tag@sub.domain.com')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(validators.isEmail('')).toBe(false)
    expect(validators.isEmail('notanemail')).toBe(false)
    expect(validators.isEmail('missing@domain')).toBe(false)
    expect(validators.isEmail('@no-user.com')).toBe(false)
  })

  it('rejects non-string', () => {
    expect(validators.isEmail(null as any)).toBe(false)
  })
})

describe('validators.isUrl', () => {
  it('accepts valid URLs', () => {
    expect(validators.isUrl('https://example.com')).toBe(true)
    expect(validators.isUrl('http://localhost:3000')).toBe(true)
    expect(validators.isUrl('ftp://files.example.com/path')).toBe(true)
  })

  it('rejects invalid URLs', () => {
    expect(validators.isUrl('')).toBe(false)
    expect(validators.isUrl('not a url')).toBe(false)
    expect(validators.isUrl('example.com')).toBe(false)
  })

  it('rejects non-string', () => {
    expect(validators.isUrl(42 as any)).toBe(false)
  })
})

describe('validators.minLength / maxLength', () => {
  it('minLength accepts strings at or above threshold', () => {
    expect(validators.minLength(3)('abc')).toBe(true)
    expect(validators.minLength(3)('abcd')).toBe(true)
  })

  it('minLength rejects strings below threshold', () => {
    expect(validators.minLength(3)('ab')).toBe(false)
  })

  it('minLength trims whitespace', () => {
    expect(validators.minLength(3)('  ab  ')).toBe(false)
  })

  it('minLength rejects non-string', () => {
    expect(validators.minLength(1)(123 as any)).toBe(false)
  })

  it('maxLength accepts strings at or below threshold', () => {
    expect(validators.maxLength(5)('hello')).toBe(true)
    expect(validators.maxLength(5)('hi')).toBe(true)
  })

  it('maxLength rejects strings above threshold', () => {
    expect(validators.maxLength(3)('abcd')).toBe(false)
  })
})

describe('validators.min / max', () => {
  it('min accepts numbers at or above threshold', () => {
    expect(validators.min(10)(10)).toBe(true)
    expect(validators.min(10)(15)).toBe(true)
  })

  it('min rejects numbers below threshold', () => {
    expect(validators.min(10)(9)).toBe(false)
  })

  it('min rejects non-number', () => {
    expect(validators.min(1)('5' as any)).toBe(false)
  })

  it('max accepts numbers at or below threshold', () => {
    expect(validators.max(100)(100)).toBe(true)
    expect(validators.max(100)(50)).toBe(true)
  })

  it('max rejects numbers above threshold', () => {
    expect(validators.max(100)(101)).toBe(false)
  })
})

describe('validators.and / or', () => {
  const alwaysTrue = () => true
  const alwaysFalse = () => false

  it('and returns true only when all pass', () => {
    expect(validators.and(alwaysTrue, alwaysTrue)('x')).toBe(true)
    expect(validators.and(alwaysTrue, alwaysFalse)('x')).toBe(false)
    expect(validators.and(alwaysFalse, alwaysTrue)('x')).toBe(false)
  })

  it('or returns true when any passes', () => {
    expect(validators.or(alwaysTrue, alwaysFalse)('x')).toBe(true)
    expect(validators.or(alwaysFalse, alwaysFalse)('x')).toBe(false)
  })
})

describe('validators.isNumber', () => {
  it('accepts numbers', () => {
    expect(validators.isNumber(42)).toBe(true)
    expect(validators.isNumber(0)).toBe(true)
    expect(validators.isNumber(-3.14)).toBe(true)
  })

  it('accepts numeric strings', () => {
    expect(validators.isNumber('42')).toBe(true)
  })

  it('rejects NaN', () => {
    expect(validators.isNumber(NaN)).toBe(false)
  })

  it('rejects non-numeric strings', () => {
    expect(validators.isNumber('abc')).toBe(false)
  })

  it('rejects other types', () => {
    expect(validators.isNumber(null)).toBe(false)
    expect(validators.isNumber(undefined)).toBe(false)
  })
})

describe('validators.matches', () => {
  it('accepts matching strings', () => {
    expect(validators.matches(/^hello/)('hello world')).toBe(true)
  })

  it('rejects non-matching strings', () => {
    expect(validators.matches(/^hello/)('goodbye')).toBe(false)
  })

  it('rejects non-string', () => {
    expect(validators.matches(/a/)(123 as any)).toBe(false)
  })
})

// --- validateFormValues ---

describe('validateFormValues', () => {
  const rules = [
    { field: 'name', tab: 'basic', label: 'Name is required', validator: validators.required },
    { field: 'slug', tab: 'basic', label: 'Slug is required', validator: validators.required },
    { field: 'content', tab: 'content', label: 'Content is required', validator: validators.required },
  ]

  it('returns empty object when all pass', () => {
    const issues = validateFormValues({
      values: { name: 'Test', slug: 'test', content: 'Some content' },
      validationRules: rules,
    })
    expect(issues).toEqual({})
  })

  it('groups issues by tab', () => {
    const issues = validateFormValues({
      values: { name: '', slug: '', content: '' },
      validationRules: rules,
    })
    expect(issues.basic).toHaveLength(2)
    expect(issues.content).toHaveLength(1)
  })

  it('returns issues only for failing rules', () => {
    const issues = validateFormValues({
      values: { name: 'Test', slug: '', content: 'Some content' },
      validationRules: rules,
    })
    expect(issues.basic).toHaveLength(1)
    expect(issues.basic![0].name).toBe('slug')
    expect(issues.content).toBeUndefined()
  })
})

// --- calculateCompletionPercentage ---

describe('calculateCompletionPercentage', () => {
  const rules = [
    { field: 'a', tab: 't', label: 'A', validator: validators.required },
    { field: 'b', tab: 't', label: 'B', validator: validators.required },
  ]

  it('returns 100 when all rules pass', () => {
    expect(calculateCompletionPercentage({ values: { a: 'x', b: 'y' }, validationRules: rules })).toBe(100)
  })

  it('returns 0 when no rules pass', () => {
    expect(calculateCompletionPercentage({ values: { a: '', b: '' }, validationRules: rules })).toBe(0)
  })

  it('returns 50 when half pass', () => {
    expect(calculateCompletionPercentage({ values: { a: 'x', b: '' }, validationRules: rules })).toBe(50)
  })

  it('returns 100 with empty rules array', () => {
    expect(calculateCompletionPercentage({ values: {}, validationRules: [] })).toBe(100)
  })
})

// --- isTabComplete ---

describe('isTabComplete', () => {
  const rules = [
    { field: 'name', tab: 'basic', label: 'Name', validator: validators.required },
    { field: 'slug', tab: 'basic', label: 'Slug', validator: validators.required },
    { field: 'content', tab: 'content', label: 'Content', validator: validators.required },
  ]

  it('returns true when all tab rules pass', () => {
    expect(isTabComplete({ values: { name: 'x', slug: 'y', content: '' }, validationRules: rules, tabName: 'basic' })).toBe(true)
  })

  it('returns false when any tab rule fails', () => {
    expect(isTabComplete({ values: { name: 'x', slug: '', content: '' }, validationRules: rules, tabName: 'basic' })).toBe(false)
  })

  it('returns true for a tab with no rules', () => {
    expect(isTabComplete({ values: {}, validationRules: rules, tabName: 'nonexistent' })).toBe(true)
  })
})

// --- createContentValidationRules ---

describe('createContentValidationRules', () => {
  it('always includes name/title, slug, and description rules', () => {
    const types = ['algorithm', 'persona', 'industry', 'case_study', 'blog_post'] as const
    for (const type of types) {
      const rules = createContentValidationRules(type)
      const fields = rules.map((r) => r.field)
      expect(fields).toContain('slug')
      expect(fields).toContain('description')
    }
  })

  it('uses "name" field for entity types', () => {
    const rules = createContentValidationRules('algorithm')
    expect(rules[0].field).toBe('name')
  })

  it('uses "title" field for case_study and blog_post', () => {
    expect(createContentValidationRules('case_study')[0].field).toBe('title')
    expect(createContentValidationRules('blog_post')[0].field).toBe('title')
  })

  it('case_study includes year, algorithms, and industries rules', () => {
    const fields = createContentValidationRules('case_study').map((r) => r.field)
    expect(fields).toContain('year')
    expect(fields).toContain('algorithms')
    expect(fields).toContain('industries')
  })

  it('blog_post includes content, author, category, and tags rules', () => {
    const fields = createContentValidationRules('blog_post').map((r) => r.field)
    expect(fields).toContain('content')
    expect(fields).toContain('author')
    expect(fields).toContain('category')
    expect(fields).toContain('tags')
  })

  it('algorithm includes main_content and related_case_studies rules', () => {
    const fields = createContentValidationRules('algorithm').map((r) => r.field)
    expect(fields).toContain('main_content')
    expect(fields).toContain('related_case_studies')
  })
})

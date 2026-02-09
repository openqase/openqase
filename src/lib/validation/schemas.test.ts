import { describe, it, expect } from 'vitest'
import {
  caseStudySchema,
  algorithmSchema,
  blogPostSchema,
  newsletterSubscriptionSchema,
  formatValidationErrors,
  validateSearchParams,
} from './schemas'

describe('caseStudySchema', () => {
  const validCaseStudy = {
    title: 'Quantum Key Distribution',
    slug: 'quantum-key-distribution',
    description: 'A study on QKD.',
  }

  it('accepts valid input', () => {
    const result = caseStudySchema.safeParse(validCaseStudy)
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = caseStudySchema.safeParse({ ...validCaseStudy, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug (uppercase)', () => {
    const result = caseStudySchema.safeParse({ ...validCaseStudy, slug: 'Bad-Slug' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug (spaces)', () => {
    const result = caseStudySchema.safeParse({ ...validCaseStudy, slug: 'has spaces' })
    expect(result.success).toBe(false)
  })

  it('accepts optional year within bounds', () => {
    const result = caseStudySchema.safeParse({ ...validCaseStudy, year: 2024 })
    expect(result.success).toBe(true)
  })

  it('rejects year below 1990', () => {
    const result = caseStudySchema.safeParse({ ...validCaseStudy, year: 1989 })
    expect(result.success).toBe(false)
  })

  it('rejects year above 2030', () => {
    const result = caseStudySchema.safeParse({ ...validCaseStudy, year: 2031 })
    expect(result.success).toBe(false)
  })

  it('defaults published to false', () => {
    const result = caseStudySchema.safeParse(validCaseStudy)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.published).toBe(false)
    }
  })

  it('defaults arrays to empty', () => {
    const result = caseStudySchema.safeParse(validCaseStudy)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.algorithms).toEqual([])
      expect(result.data.industries).toEqual([])
      expect(result.data.resource_links).toEqual([])
    }
  })
})

describe('algorithmSchema', () => {
  const validAlgorithm = {
    name: 'Quantum Approximate Optimization',
    slug: 'qaoa',
    description: 'An optimization algorithm.',
  }

  it('accepts valid input', () => {
    const result = algorithmSchema.safeParse(validAlgorithm)
    expect(result.success).toBe(true)
  })

  it('accepts valid complexity values', () => {
    for (const complexity of ['Beginner', 'Intermediate', 'Advanced']) {
      const result = algorithmSchema.safeParse({ ...validAlgorithm, complexity })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid complexity', () => {
    const result = algorithmSchema.safeParse({ ...validAlgorithm, complexity: 'Expert' })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields as null', () => {
    const result = algorithmSchema.safeParse({
      ...validAlgorithm,
      quantum_advantage: null,
      complexity: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('blogPostSchema', () => {
  const validPost = {
    title: 'Introduction to Quantum Computing',
    slug: 'intro-quantum',
    description: 'A beginner guide.',
  }

  it('accepts valid input', () => {
    const result = blogPostSchema.safeParse(validPost)
    expect(result.success).toBe(true)
  })

  it('defaults tags to empty array', () => {
    const result = blogPostSchema.safeParse(validPost)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual([])
    }
  })

  it('accepts valid datetime for published_at', () => {
    const result = blogPostSchema.safeParse({
      ...validPost,
      published_at: '2024-01-15T10:30:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid datetime for published_at', () => {
    const result = blogPostSchema.safeParse({
      ...validPost,
      published_at: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('newsletterSubscriptionSchema', () => {
  it('accepts valid email', () => {
    const result = newsletterSubscriptionSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = newsletterSubscriptionSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = newsletterSubscriptionSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('defaults source to "website"', () => {
    const result = newsletterSubscriptionSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.source).toBe('website')
    }
  })
})

describe('formatValidationErrors', () => {
  it('flattens Zod errors to Record<string, string>', () => {
    const result = caseStudySchema.safeParse({ title: '', slug: 'Bad Slug' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatValidationErrors(result.error)
      expect(typeof formatted).toBe('object')
      expect(Object.keys(formatted).length).toBeGreaterThan(0)
      // Each value should be a string
      for (const value of Object.values(formatted)) {
        expect(typeof value).toBe('string')
      }
    }
  })

  it('joins nested paths with dots', () => {
    // Create a schema with nested object to test path joining
    const result = caseStudySchema.safeParse({
      title: 'Test',
      slug: 'test',
      resource_links: [{ url: 'not-a-url', title: '' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatValidationErrors(result.error)
      // Should have dot-separated path like "resource_links.0.url"
      const hasNestedPath = Object.keys(formatted).some((key) => key.includes('.'))
      expect(hasNestedPath).toBe(true)
    }
  })
})

describe('validateSearchParams', () => {
  it('applies defaults for pagination', () => {
    const result = validateSearchParams(new URLSearchParams())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(10)
      expect(result.data.includeUnpublished).toBe(false)
    }
  })

  it('coerces string numbers to numbers', () => {
    const result = validateSearchParams(new URLSearchParams('page=3&pageSize=20'))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(20)
    }
  })

  it('accepts optional filter params', () => {
    const result = validateSearchParams(
      new URLSearchParams('slug=test&algorithm=qaoa&industry=finance')
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.slug).toBe('test')
      expect(result.data.algorithm).toBe('qaoa')
      expect(result.data.industry).toBe('finance')
    }
  })
})

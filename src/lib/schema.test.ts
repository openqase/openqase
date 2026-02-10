import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrganizationSchema,
  getCaseStudySchema,
  getCourseSchema,
  getFAQSchema,
  getQuantumEntitySchema,
  getBlogPostSchema,
  getWebSiteSchema,
  getBreadcrumbSchema,
} from './schema'

const BASE_URL = 'https://test.openqase.com'

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = BASE_URL
})

describe('getOrganizationSchema', () => {
  it('returns correct @context and @type', () => {
    const schema = getOrganizationSchema()
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Organization')
  })

  it('uses NEXT_PUBLIC_SITE_URL for url', () => {
    const schema = getOrganizationSchema()
    expect(schema.url).toBe(BASE_URL)
  })

  it('contains required fields', () => {
    const schema = getOrganizationSchema()
    expect(schema.name).toBe('OpenQase')
    expect(schema.description).toBeDefined()
    expect(schema.knowsAbout).toContain('Quantum Computing')
  })
})

describe('getCaseStudySchema', () => {
  const caseStudy = {
    id: '1',
    title: 'Quantum Optimization at HSBC',
    description: 'A case study about quantum computing',
    published_at: '2025-01-15',
    updated_at: '2025-02-01',
    slug: 'quantum-optimization-hsbc',
    year: 2025,
    case_study_industry_relations: [
      { industries: { name: 'Finance', slug: 'finance' } },
    ],
    algorithm_case_study_relations: [
      { algorithms: { name: 'QAOA', slug: 'qaoa' } },
    ],
    case_study_persona_relations: [],
    case_study_quantum_software_relations: [
      { quantum_software: { name: 'Qiskit', slug: 'qiskit' } },
    ],
    case_study_quantum_hardware_relations: [
      { quantum_hardware: { name: 'IBM Eagle', slug: 'ibm-eagle' } },
    ],
    case_study_quantum_company_relations: [
      { quantum_companies: { name: 'IBM', slug: 'ibm' } },
    ],
    case_study_partner_company_relations: [
      { partner_companies: { name: 'HSBC', slug: 'hsbc' } },
    ],
  }

  it('returns Article type with correct headline', () => {
    const schema = getCaseStudySchema(caseStudy)
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Article')
    expect(schema.headline).toBe('Quantum Optimization at HSBC')
  })

  it('constructs correct URL', () => {
    const schema = getCaseStudySchema(caseStudy)
    expect(schema.url).toBe(`${BASE_URL}/case-study/quantum-optimization-hsbc`)
  })

  it('uses updated_at for dateModified', () => {
    const schema = getCaseStudySchema(caseStudy)
    expect(schema.dateModified).toBe('2025-02-01')
  })

  it('falls back to published_at for dateModified when no updated_at', () => {
    const cs = { ...caseStudy, updated_at: undefined }
    const schema = getCaseStudySchema(cs)
    expect(schema.dateModified).toBe('2025-01-15')
  })

  it('extracts keywords from relations', () => {
    const schema = getCaseStudySchema(caseStudy)
    expect(schema.keywords).toContain('Finance')
    expect(schema.keywords).toContain('QAOA')
    expect(schema.keywords).toContain('IBM')
    expect(schema.keywords).toContain('HSBC')
  })

  it('includes mentions with correct types', () => {
    const schema = getCaseStudySchema(caseStudy)
    const mentions = schema.mentions
    expect(mentions).toContainEqual({ '@type': 'Organization', name: 'IBM' })
    expect(mentions).toContainEqual({ '@type': 'Organization', name: 'HSBC' })
    expect(mentions).toContainEqual({ '@type': 'SoftwareApplication', name: 'Qiskit' })
    expect(mentions).toContainEqual({ '@type': 'Product', name: 'IBM Eagle' })
  })

  it('handles empty relations gracefully', () => {
    const minimal = {
      id: '2',
      title: 'Basic',
      description: 'Desc',
      published_at: '2025-01-01',
      slug: 'basic',
    }
    const schema = getCaseStudySchema(minimal)
    expect(schema.headline).toBe('Basic')
    expect(schema.mentions).toEqual([])
  })
})

describe('getCourseSchema', () => {
  const content = {
    id: '1',
    name: 'Financial Analyst',
    description: 'Learning path for analysts',
    slug: 'financial-analyst',
  }

  it('returns Course type', () => {
    const schema = getCourseSchema(content, 'persona')
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Course')
  })

  it('constructs correct URL for each course type', () => {
    expect(getCourseSchema(content, 'persona').url).toBe(
      `${BASE_URL}/paths/persona/financial-analyst`
    )
    expect(getCourseSchema(content, 'industry').url).toBe(
      `${BASE_URL}/paths/industry/financial-analyst`
    )
    expect(getCourseSchema(content, 'algorithm').url).toBe(
      `${BASE_URL}/paths/algorithm/financial-analyst`
    )
  })

  it('includes educational fields', () => {
    const schema = getCourseSchema(content, 'persona')
    expect(schema.courseMode).toBe('online')
    expect(schema.educationalLevel).toBe('Professional')
    expect(schema.isAccessibleForFree).toBe(true)
  })
})

describe('getFAQSchema', () => {
  it('returns FAQPage type', () => {
    const schema = getFAQSchema()
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('FAQPage')
  })

  it('has main entity questions', () => {
    const schema = getFAQSchema()
    expect(schema.mainEntity.length).toBeGreaterThanOrEqual(3)
    schema.mainEntity.forEach((q: any) => {
      expect(q['@type']).toBe('Question')
      expect(q.name).toBeDefined()
      expect(q.acceptedAnswer['@type']).toBe('Answer')
      expect(q.acceptedAnswer.text).toBeDefined()
    })
  })
})

describe('getQuantumEntitySchema', () => {
  const entity = {
    id: '1',
    name: 'IBM Quantum',
    description: 'Leading quantum computing company',
    slug: 'ibm-quantum',
    website: 'https://quantum.ibm.com',
    founded_year: 2016,
    headquarters: 'Yorktown Heights, NY',
    specialization: 'Quantum Hardware',
    funding_stage: 'Public',
  }

  it('maps quantum-companies to Organization', () => {
    const schema = getQuantumEntitySchema(entity, 'quantum-companies')
    expect(schema['@type']).toBe('Organization')
  })

  it('maps partner-companies to Organization', () => {
    const schema = getQuantumEntitySchema(entity, 'partner-companies')
    expect(schema['@type']).toBe('Organization')
  })

  it('maps quantum-software to SoftwareApplication', () => {
    const sw = { ...entity, category: 'SDK', key_features: ['Circuits', 'Simulation'], target_industries: ['Finance', 'Healthcare'] }
    const schema = getQuantumEntitySchema(sw, 'quantum-software')
    expect(schema['@type']).toBe('SoftwareApplication')
    expect(schema.applicationCategory).toBe('Quantum Computing Software')
    expect(schema.applicationSubCategory).toBe('SDK')
    expect(schema.featureList).toEqual(['Circuits', 'Simulation'])
    expect(schema.audience.audienceType).toBe('Finance, Healthcare')
  })

  it('maps quantum-hardware to Product', () => {
    const hw = { ...entity, category: 'Processor', key_features: ['127 qubits', 'Error correction'] }
    const schema = getQuantumEntitySchema(hw, 'quantum-hardware')
    expect(schema['@type']).toBe('Product')
    expect(schema.category).toBe('Quantum Computing Hardware')
    expect(schema.model).toBe('Processor')
    expect(schema.additionalProperty).toHaveLength(2)
  })

  it('includes organization-specific fields', () => {
    const schema = getQuantumEntitySchema(entity, 'quantum-companies')
    expect(schema.sameAs).toContain('https://quantum.ibm.com')
    expect(schema.foundingDate).toBe('2016')
    expect(schema.location).toEqual({ '@type': 'Place', name: 'Yorktown Heights, NY' })
    expect(schema.knowsAbout).toContain('Quantum Hardware')
  })

  it('constructs correct URL', () => {
    const schema = getQuantumEntitySchema(entity, 'quantum-companies')
    expect(schema.url).toBe(`${BASE_URL}/paths/quantum-companies/ibm-quantum`)
  })

  it('includes related case studies in mentions', () => {
    const entityWithRelations = {
      ...entity,
      case_study_quantum_company_relations: [
        { case_studies: { title: 'HSBC Case', slug: 'hsbc-case' } },
      ],
    }
    const schema = getQuantumEntitySchema(entityWithRelations, 'quantum-companies')
    expect(schema.mentions).toContainEqual({
      '@type': 'Article',
      name: 'HSBC Case',
      url: `${BASE_URL}/case-study/hsbc-case`,
    })
  })
})

describe('getBlogPostSchema', () => {
  const blogPost = {
    id: '1',
    title: 'Getting Started with Quantum',
    description: 'An intro post',
    slug: 'getting-started',
    published_at: '2025-06-01',
    author: 'Alice',
    category: 'Tutorial',
    tags: ['quantum', 'beginner'],
  }

  it('returns BlogPosting type', () => {
    const schema = getBlogPostSchema(blogPost)
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('BlogPosting')
  })

  it('uses person author when provided', () => {
    const schema = getBlogPostSchema(blogPost)
    expect(schema.author).toEqual({ '@type': 'Person', name: 'Alice' })
  })

  it('falls back to Organization author when no author', () => {
    const noAuthor = { ...blogPost, author: undefined }
    const schema = getBlogPostSchema(noAuthor)
    expect(schema.author).toEqual({ '@type': 'Organization', name: 'OpenQase' })
  })

  it('constructs correct URL', () => {
    const schema = getBlogPostSchema(blogPost)
    expect(schema.url).toBe(`${BASE_URL}/blog/getting-started`)
  })

  it('joins tags as keywords', () => {
    const schema = getBlogPostSchema(blogPost)
    expect(schema.keywords).toBe('quantum, beginner')
  })

  it('uses default keywords when no tags', () => {
    const noTags = { ...blogPost, tags: undefined }
    const schema = getBlogPostSchema(noTags)
    expect(schema.keywords).toBe('Quantum Computing, Business Applications')
  })

  it('uses description fallback when missing', () => {
    const noDesc = { ...blogPost, description: undefined }
    const schema = getBlogPostSchema(noDesc)
    expect(schema.description).toBe('Blog post: Getting Started with Quantum')
  })
})

describe('getWebSiteSchema', () => {
  it('returns WebSite type', () => {
    const schema = getWebSiteSchema()
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebSite')
  })

  it('includes search action', () => {
    const schema = getWebSiteSchema()
    expect(schema.potentialAction['@type']).toBe('SearchAction')
    expect(schema.potentialAction.target.urlTemplate).toContain('search')
  })

  it('uses configured URL', () => {
    const schema = getWebSiteSchema()
    expect(schema.url).toBe(BASE_URL)
  })
})

describe('getBreadcrumbSchema', () => {
  it('returns BreadcrumbList type', () => {
    const schema = getBreadcrumbSchema([{ name: 'Home', url: '/' }])
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('maps breadcrumbs with correct positions', () => {
    const crumbs = [
      { name: 'Home', url: '/' },
      { name: 'Case Studies', url: '/case-study' },
      { name: 'HSBC', url: '/case-study/hsbc' },
    ]
    const schema = getBreadcrumbSchema(crumbs)
    expect(schema.itemListElement).toHaveLength(3)
    expect(schema.itemListElement[0].position).toBe(1)
    expect(schema.itemListElement[0].name).toBe('Home')
    expect(schema.itemListElement[0].item).toBe(`${BASE_URL}/`)
    expect(schema.itemListElement[2].position).toBe(3)
    expect(schema.itemListElement[2].item).toBe(`${BASE_URL}/case-study/hsbc`)
  })
})

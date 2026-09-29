/**
 * Validates that every registered CMS content type's Zod schema accepts the
 * payloads its admin form actually sends (src/app/admin/<type>/[id]/client.tsx).
 *
 * "newRecord" mirrors the form's initial useState values for a new record with
 * only the required fields filled in; "filled" mirrors a realistic edited record.
 * Keys the form sends that aren't CMS fields (id, published, relationship ID
 * arrays) are included on purpose — the schema must strip them, not reject them.
 */
import { describe, it, expect } from 'vitest'
import { generateZodSchema } from './schema'
import { getContentType, getAllContentTypes } from './registry'

type Payload = Record<string, unknown>

const fixtures: Record<string, { newRecord: Payload; filled: Payload }> = {
  algorithms: {
    newRecord: {
      id: undefined,
      name: 'Grover Search',
      slug: 'grover-search',
      description: '',
      main_content: '',
      use_cases: [],
      related_case_studies: [],
      related_industries: [],
      related_personas: [],
      published: false,
      steps: '',
      academic_references: '',
    },
    filled: {
      id: 'a1',
      name: 'Grover Search',
      slug: 'grover-search',
      description: 'Unstructured search',
      main_content: '# Grover',
      use_cases: ['Database search', 'Optimisation'],
      related_case_studies: ['cs1'],
      related_industries: ['i1'],
      related_personas: ['p1'],
      published: true,
      steps: '1. Init',
      academic_references: '[^1]: Grover 1996',
      quantum_advantage: 'Quadratic',
    },
  },
  'case-studies': {
    newRecord: {
      id: undefined,
      title: 'New Study',
      slug: 'new-study',
      description: '',
      main_content: '',
      quantum_software: [],
      quantum_hardware: [],
      quantum_companies: [],
      partner_companies: [],
      algorithms: [],
      industries: [],
      personas: [],
      published: false,
      featured: false,
      academic_references: '',
      resource_links: [],
      year: 2026,
    },
    filled: {
      id: 'cs1',
      title: 'Portfolio Optimisation',
      slug: 'portfolio-optimisation',
      description: 'desc',
      main_content: 'body',
      quantum_software: ['s1'],
      quantum_hardware: ['h1'],
      quantum_companies: ['qc1'],
      partner_companies: ['pc1'],
      algorithms: ['a1'],
      industries: ['i1'],
      personas: ['p1'],
      published: true,
      featured: true,
      academic_references: '[^1]: Ref',
      resource_links: [
        { url: 'https://example.com/paper', label: 'Paper', order: 1 },
        { url: 'https://example.com/blog', label: 'Blog', order: 2 },
      ],
      year: 2024,
    },
  },
  industries: {
    newRecord: { id: undefined, name: 'Finance', slug: 'finance', description: '', main_content: '', published: false },
    filled: { id: 'i1', name: 'Finance', slug: 'finance', description: 'd', main_content: 'm', published: true },
  },
  personas: {
    newRecord: {
      id: undefined,
      name: 'Researcher',
      slug: 'researcher',
      description: '',
      expertise: [],
      main_content: '',
      recommended_reading: '',
      industry: [],
      published: false,
    },
    filled: {
      id: 'p1',
      name: 'Researcher',
      slug: 'researcher',
      description: 'd',
      expertise: ['Quantum chemistry', 'Linear algebra'],
      main_content: 'm',
      recommended_reading: 'Nielsen & Chuang',
      industry: ['i1'],
      published: true,
    },
  },
  'blog-posts': {
    newRecord: {
      id: undefined,
      title: 'Hello',
      slug: 'hello',
      description: '',
      content: '',
      author: '',
      featured_image: '',
      category: '',
      tags: [],
      related_posts: [],
      published: false,
      featured: false,
      published_at: null,
    },
    filled: {
      id: 'b1',
      title: 'Hello',
      slug: 'hello',
      description: 'd',
      content: 'c',
      author: 'Dave',
      featured_image: 'https://example.com/img.jpg',
      category: 'News',
      tags: ['quantum', 'news'],
      related_posts: ['b2'],
      published: true,
      featured: true,
      published_at: '2026-09-01',
    },
  },
  'quantum-companies': {
    newRecord: {
      id: undefined,
      name: 'Acme Quantum',
      slug: 'acme-quantum',
      description: '',
      main_content: '',
      company_type: '',
      founded_year: '',
      funding_stage: '',
      headquarters: '',
      website_url: '',
      linkedin_url: '',
      published: false,
    },
    filled: {
      id: 'qc1',
      name: 'Acme Quantum',
      slug: 'acme-quantum',
      description: 'd',
      main_content: 'm',
      company_type: 'Hardware',
      founded_year: '2019', // bound to a plain <Input>, arrives as a string
      funding_stage: 'Series A',
      headquarters: 'London',
      website_url: 'https://acme.example',
      linkedin_url: 'https://linkedin.com/company/acme',
      published: true,
    },
  },
  'partner-companies': {
    newRecord: {
      id: undefined,
      name: 'Big Bank',
      slug: 'big-bank',
      description: '',
      main_content: '',
      industry: '',
      company_size: '',
      headquarters: '',
      partnership_type: '',
      quantum_use_cases: '',
      website_url: '',
      linkedin_url: '',
      published: false,
    },
    filled: {
      id: 'pc1',
      name: 'Big Bank',
      slug: 'big-bank',
      description: 'd',
      main_content: 'm',
      industry: 'Finance',
      company_size: 'Enterprise',
      headquarters: 'NYC',
      partnership_type: 'Research',
      quantum_use_cases: 'Risk',
      website_url: 'https://bank.example',
      linkedin_url: '',
      published: true,
    },
  },
  'quantum-hardware': {
    newRecord: {
      id: undefined,
      name: 'QPU One',
      slug: 'qpu-one',
      description: '',
      main_content: '',
      vendor: '',
      technology_type: '',
      qubit_count: '',
      coherence_time: '',
      gate_fidelity: '',
      connectivity: '',
      availability: '',
      access_model: '',
      website_url: '',
      documentation_url: '',
      published: false,
    },
    filled: {
      id: 'h1',
      name: 'QPU One',
      slug: 'qpu-one',
      description: 'd',
      main_content: 'm',
      vendor: 'Acme',
      technology_type: 'superconducting',
      qubit_count: '127',
      coherence_time: '100 μs',
      gate_fidelity: '99.5',
      connectivity: 'Heavy-hex',
      availability: 'Cloud',
      access_model: 'Paid',
      website_url: 'https://acme.example/qpu',
      documentation_url: '',
      published: true,
    },
  },
  'quantum-software': {
    newRecord: {
      id: undefined,
      name: 'Qiskit',
      slug: 'qiskit',
      description: '',
      main_content: '',
      vendor: '',
      website_url: '',
      documentation_url: '',
      github_url: '',
      license_type: '',
      pricing_model: '',
      published: false,
    },
    filled: {
      id: 's1',
      name: 'Qiskit',
      slug: 'qiskit',
      description: 'd',
      main_content: 'm',
      vendor: 'IBM',
      website_url: 'https://qiskit.org',
      documentation_url: 'https://docs.quantum.ibm.com',
      github_url: 'https://github.com/Qiskit/qiskit',
      license_type: 'Apache-2.0',
      pricing_model: 'Free',
      published: true,
    },
  },
}

function schemaFor(slug: string) {
  const ct = getContentType(slug)
  if (!ct) throw new Error(`Unknown content type ${slug}`)
  return generateZodSchema(ct)
}

describe('content type schemas accept admin form payloads', () => {
  it('has fixtures for every registered content type', () => {
    expect(Object.keys(fixtures).sort()).toEqual(getAllContentTypes().map(ct => ct.slug).sort())
  })

  for (const [slug, { newRecord, filled }] of Object.entries(fixtures)) {
    describe(slug, () => {
      it('accepts a new record with form defaults', () => {
        const result = schemaFor(slug).safeParse(newRecord)
        expect(result.error?.issues ?? []).toEqual([])
        expect(result.success).toBe(true)
      })

      it('accepts a filled record', () => {
        const result = schemaFor(slug).safeParse(filled)
        expect(result.error?.issues ?? []).toEqual([])
        expect(result.success).toBe(true)
      })

      it('strips system and relationship keys', () => {
        const result = schemaFor(slug).safeParse(filled)
        expect(result.data).not.toHaveProperty('id')
        expect(result.data).not.toHaveProperty('published')
      })

      it('rejects a blank required title/name', () => {
        const ct = getContentType(slug)!
        const titleField = ct.metadata.titleField
        const result = schemaFor(slug).safeParse({ ...newRecord, [titleField]: '' })
        expect(result.success).toBe(false)
      })
    })
  }
})

describe('array, json and previously-dropped fields survive parsing', () => {
  it('case-studies: resource_links array is preserved', () => {
    const data = schemaFor('case-studies').parse(fixtures['case-studies'].filled)
    expect(data.resource_links).toEqual(fixtures['case-studies'].filled.resource_links)
    expect(schemaFor('case-studies').parse(fixtures['case-studies'].newRecord).resource_links).toEqual([])
  })

  it('algorithms: use_cases array is preserved', () => {
    const data = schemaFor('algorithms').parse(fixtures.algorithms.filled)
    expect(data.use_cases).toEqual(['Database search', 'Optimisation'])
  })

  it('personas: expertise array is preserved', () => {
    const data = schemaFor('personas').parse(fixtures.personas.filled)
    expect(data.expertise).toEqual(['Quantum chemistry', 'Linear algebra'])
  })

  it('blog-posts: tags array is preserved', () => {
    const data = schemaFor('blog-posts').parse(fixtures['blog-posts'].filled)
    expect(data.tags).toEqual(['quantum', 'news'])
  })

  it('quantum-companies: funding_stage persists and founded_year is coerced', () => {
    const data = schemaFor('quantum-companies').parse(fixtures['quantum-companies'].filled)
    expect(data.funding_stage).toBe('Series A')
    expect(data.founded_year).toBe(2019)
  })

  it('quantum-hardware: numeric strings are coerced and blanks become null', () => {
    const filled = schemaFor('quantum-hardware').parse(fixtures['quantum-hardware'].filled)
    expect(filled.qubit_count).toBe(127)
    expect(filled.gate_fidelity).toBe(99.5)
    expect(filled.documentation_url).toBeNull()

    const blank = schemaFor('quantum-hardware').parse(fixtures['quantum-hardware'].newRecord)
    expect(blank.qubit_count).toBeNull()
    expect(blank.gate_fidelity).toBeNull()
    expect(blank.website_url).toBeNull()
    expect(blank.technology_type).toBeNull()
  })

  it('blank optional urls save as null across types', () => {
    for (const slug of ['quantum-software', 'quantum-companies', 'partner-companies', 'blog-posts']) {
      const data = schemaFor(slug).parse(fixtures[slug].newRecord)
      for (const [key, value] of Object.entries(data)) {
        if (key.endsWith('_url') || key === 'featured_image') expect(value).toBeNull()
      }
    }
  })
})

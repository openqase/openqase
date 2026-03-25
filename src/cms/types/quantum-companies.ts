import { defineContentType } from '../define'

export const quantumCompanies = defineContentType({
  slug: 'quantum-companies',
  tableName: 'quantum_companies',
  label: { singular: 'Quantum Company', plural: 'Quantum Companies' },
  basePath: '/paths/quantum-companies',
  adminPath: '/admin/quantum-companies',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'company_type', type: 'text' },
    { name: 'founded_year', type: 'number', min: 1900, max: 2100 },
    { name: 'headquarters', type: 'text' },
    { name: 'website_url', type: 'url' },
    { name: 'linkedin_url', type: 'url' },
  ],
  relationships: [
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_quantum_company_relations',
      foreignKey: 'quantum_company_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
})

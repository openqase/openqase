import { defineContentType } from '../define'

export const quantumSoftware = defineContentType({
  slug: 'quantum-software',
  tableName: 'quantum_software',
  label: { singular: 'Quantum Software', plural: 'Quantum Software' },
  basePath: '/paths/quantum-software',
  adminPath: '/admin/quantum-software',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'vendor', type: 'text' },
    { name: 'license_type', type: 'text' },
    { name: 'documentation_url', type: 'url' },
    { name: 'github_url', type: 'url' },
    { name: 'website_url', type: 'url' },
    { name: 'pricing_model', type: 'text' },
  ],
  relationships: [
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_quantum_software_relations',
      foreignKey: 'quantum_software_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
})

import { defineContentType } from '../define'

export const quantumHardware = defineContentType({
  slug: 'quantum-hardware',
  tableName: 'quantum_hardware',
  label: { singular: 'Quantum Hardware', plural: 'Quantum Hardware' },
  basePath: '/paths/quantum-hardware',
  adminPath: '/admin/quantum-hardware',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'vendor', type: 'text' },
    { name: 'technology_type', type: 'text' },
    { name: 'qubit_count', type: 'number' },
    { name: 'connectivity', type: 'text' },
    { name: 'gate_fidelity', type: 'number' },
    { name: 'coherence_time', type: 'text' },
    { name: 'availability', type: 'text' },
    { name: 'documentation_url', type: 'url' },
    { name: 'website_url', type: 'url' },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
  relationships: [
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_quantum_hardware_relations',
      foreignKey: 'quantum_hardware_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
  ],
})

import { defineContentType } from '../define'

export const algorithms = defineContentType({
  slug: 'algorithms',
  tableName: 'algorithms',
  label: { singular: 'Algorithm', plural: 'Algorithms' },
  basePath: '/paths/algorithm',
  adminPath: '/admin/algorithms',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'use_cases', type: 'textarea' },
    { name: 'steps', type: 'markdown' },
    { name: 'academic_references', type: 'markdown' },
    { name: 'quantum_advantage', type: 'textarea' },
  ],
  relationships: [
    {
      name: 'industries',
      targetType: 'industries',
      junction: 'algorithm_industry_relations',
      foreignKey: 'algorithm_id',
      targetKey: 'industry_id',
    },
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'algorithm_case_study_relations',
      foreignKey: 'algorithm_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
    {
      name: 'personas',
      targetType: 'personas',
      junction: 'persona_algorithm_relations',
      foreignKey: 'algorithm_id',
      targetKey: 'persona_id',
    },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
  adminExtensions: [{ position: 'after:academic_references', component: 'CitationHelper' }],
})

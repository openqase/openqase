import { defineContentType } from '../define'

export const personas = defineContentType({
  slug: 'personas',
  tableName: 'personas',
  label: { singular: 'Persona', plural: 'Personas' },
  basePath: '/paths/persona',
  adminPath: '/admin/personas',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'recommended_reading', type: 'textarea' },
  ],
  relationships: [
    {
      name: 'industries',
      targetType: 'industries',
      junction: 'persona_industry_relations',
      foreignKey: 'persona_id',
      targetKey: 'industry_id',
    },
    {
      name: 'algorithms',
      targetType: 'algorithms',
      junction: 'persona_algorithm_relations',
      foreignKey: 'persona_id',
      targetKey: 'algorithm_id',
    },
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_persona_relations',
      foreignKey: 'persona_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
})

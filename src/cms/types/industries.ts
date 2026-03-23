import { defineContentType } from '../define'

export const industries = defineContentType({
  slug: 'industries',
  tableName: 'industries',
  label: { singular: 'Industry', plural: 'Industries' },
  basePath: '/paths/industry',
  adminPath: '/admin/industries',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
  ],
  relationships: [
    {
      name: 'algorithms',
      targetType: 'algorithms',
      junction: 'algorithm_industry_relations',
      foreignKey: 'industry_id',
      targetKey: 'algorithm_id',
      selectFields: ['id', 'name', 'slug', 'use_cases'],
    },
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_industry_relations',
      foreignKey: 'industry_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
    {
      name: 'personas',
      targetType: 'personas',
      junction: 'persona_industry_relations',
      foreignKey: 'industry_id',
      targetKey: 'persona_id',
    },
  ],
  metadata: {
    titleField: 'name',
    descriptionField: 'description',
  },
})

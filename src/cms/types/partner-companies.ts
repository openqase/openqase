import { defineContentType } from '../define'

export const partnerCompanies = defineContentType({
  slug: 'partner-companies',
  tableName: 'partner_companies',
  label: { singular: 'Partner Company', plural: 'Partner Companies' },
  basePath: '/paths/partner-companies',
  adminPath: '/admin/partner-companies',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'slug', type: 'slug', from: 'name' },
    { name: 'description', type: 'textarea', maxLength: 1000 },
    { name: 'main_content', type: 'markdown' },
    { name: 'industry', type: 'text' },
    { name: 'company_size', type: 'text' },
    { name: 'headquarters', type: 'text' },
    { name: 'partnership_type', type: 'text' },
    { name: 'quantum_initiatives', type: 'textarea' },
    { name: 'website_url', type: 'url' },
    { name: 'linkedin_url', type: 'url' },
  ],
  relationships: [
    {
      name: 'case_studies',
      targetType: 'case-studies',
      junction: 'case_study_partner_company_relations',
      foreignKey: 'partner_company_id',
      targetKey: 'case_study_id',
      selectFields: ['id', 'title', 'slug', 'description', 'published_at', 'published'],
    },
  ],
  metadata: { titleField: 'name', descriptionField: 'description' },
})

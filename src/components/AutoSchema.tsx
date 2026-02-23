// Auto-inject schema markup Ghost-style
// Invisible to content creators, automatic for developers

import { 
  getOrganizationSchema, 
  getCaseStudySchema, 
  getCourseSchema, 
  getFAQSchema,
  getBreadcrumbSchema,
  getQuantumEntitySchema,
  getBlogPostSchema,
  getWebSiteSchema 
} from '@/lib/schema';

interface AutoSchemaProps {
  type: 'organization' | 'case-study' | 'course' | 'faq' | 'breadcrumb' | 'quantum-entity' | 'blog-post' | 'website';
  data?: any;
  courseType?: 'persona' | 'industry' | 'algorithm';
  entityType?: 'quantum-companies' | 'partner-companies' | 'quantum-software' | 'quantum-hardware';
  breadcrumbs?: Array<{name: string, url: string}>;
}

export function AutoSchema({ type, data, courseType, entityType, breadcrumbs }: AutoSchemaProps) {
  let schema;
  
  switch (type) {
    case 'organization':
      schema = getOrganizationSchema();
      break;
    case 'case-study':
      if (!data) return null;
      schema = getCaseStudySchema(data);
      break;
    case 'course':
      if (!data || !courseType) return null;
      schema = getCourseSchema(data, courseType);
      break;
    case 'quantum-entity':
      if (!data || !entityType) return null;
      schema = getQuantumEntitySchema(data, entityType);
      break;
    case 'blog-post':
      if (!data) return null;
      schema = getBlogPostSchema(data);
      break;
    case 'website':
      schema = getWebSiteSchema();
      break;
    case 'faq':
      schema = getFAQSchema();
      break;
    case 'breadcrumb':
      if (!breadcrumbs) return null;
      schema = getBreadcrumbSchema(breadcrumbs);
      break;
    default:
      return null;
  }
  
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ 
        __html: JSON.stringify(schema, null, 2).replace(/</g, '\\u003c')
      }}
    />
  );
}

// Convenience wrapper for multiple schemas on one page
interface MultiSchemaProps {
  schemas: Array<{
    type: AutoSchemaProps['type'];
    data?: any;
    courseType?: AutoSchemaProps['courseType'];
    entityType?: AutoSchemaProps['entityType'];
    breadcrumbs?: AutoSchemaProps['breadcrumbs'];
  }>;
}

export function MultiSchema({ schemas }: MultiSchemaProps) {
  return (
    <>
      {schemas.map((schemaProps, index) => (
        <AutoSchema key={index} {...schemaProps} />
      ))}
    </>
  );
}
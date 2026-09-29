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
  getWebSiteSchema,
  type CaseStudy,
  type LearningContent,
  type BlogPost,
  type QuantumEntity
} from '@/lib/schema';

export type SchemaData = CaseStudy | LearningContent | BlogPost | QuantumEntity | Record<string, unknown>;

interface AutoSchemaProps {
  type: 'organization' | 'case-study' | 'course' | 'faq' | 'breadcrumb' | 'quantum-entity' | 'blog-post' | 'website';
  data?: SchemaData;
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
      schema = getCaseStudySchema(data as CaseStudy);
      break;
    case 'course':
      if (!data || !courseType) return null;
      schema = getCourseSchema(data as LearningContent, courseType);
      break;
    case 'quantum-entity':
      if (!data || !entityType) return null;
      schema = getQuantumEntitySchema(data as QuantumEntity, entityType);
      break;
    case 'blog-post':
      if (!data) return null;
      schema = getBlogPostSchema(data as BlogPost);
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
    data?: SchemaData;
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
// Ghost-style automatic schema generation
// Uses existing content data to generate SEO schema markup

interface BaseContent {
  title?: string;
  name?: string;
  description?: string;
  published_at?: string;
  updated_at?: string;
  slug?: string;
}

interface CaseStudy extends BaseContent {
  id: string;
  title: string;
  description: string;
  published_at: string;
  slug: string;
  year?: number;
  main_content?: string;
  academic_references?: string;
  case_study_industry_relations?: Array<{ industries: { name: string; slug?: string | null } | null }>;
  algorithm_case_study_relations?: Array<{ algorithms: { name: string; slug?: string | null } | null }>;
  case_study_persona_relations?: Array<{ personas: { name: string; slug?: string | null } | null }>;
  case_study_quantum_software_relations?: Array<{ quantum_software: { name: string; slug?: string | null } | null }>;
  case_study_quantum_hardware_relations?: Array<{ quantum_hardware: { name: string; slug?: string | null } | null }>;
  case_study_quantum_company_relations?: Array<{ quantum_companies: { name: string; slug?: string | null } | null }>;
  case_study_partner_company_relations?: Array<{ partner_companies: { name: string; slug?: string | null } | null }>;
}

interface LearningContent extends BaseContent {
  id: string;
  name: string;
  description: string;
  slug: string;
}

interface BlogPost extends BaseContent {
  id: string;
  title: string;
  description?: string;
  slug: string;
  published_at?: string;
  author?: string;
  category?: string;
  tags?: string[];
  content?: string;
}

interface QuantumEntity extends BaseContent {
  id: string;
  name: string;
  description: string;
  slug: string;
  website?: string;
  founded_year?: number;
  headquarters?: string;
  company_type?: string;
  specialization?: string;
  funding_stage?: string;
  category?: string;
  key_features?: string[];
  use_cases?: string[];
  target_industries?: string[];
  case_study_quantum_company_relations?: Array<{ case_studies: { title: string; slug?: string | null } | null }>;
  case_study_quantum_software_relations?: Array<{ case_studies: { title: string; slug?: string | null } | null }>;
  case_study_quantum_hardware_relations?: Array<{ case_studies: { title: string; slug?: string | null } | null }>;
  case_study_partner_company_relations?: Array<{ case_studies: { title: string; slug?: string | null } | null }>;
}

// Organization schema - site-wide authority
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "OpenQase",
    "description": "Quantum computing business applications platform providing real-world case studies and learning paths",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com",
    "foundingDate": "2024",
    "areaServed": "Worldwide",
    "knowsAbout": [
      "Quantum Computing",
      "Business Applications", 
      "Case Studies",
      "Quantum Algorithms",
      "Industry Applications"
    ],
    "sameAs": []
  };
}

// Case study article schema - auto-generated from case study data
export function getCaseStudySchema(caseStudy: CaseStudy) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com";
  
  // Extract entity names for enhanced metadata
  const industries = caseStudy.case_study_industry_relations?.map(r => r.industries?.name).filter(Boolean) || [];
  const algorithms = caseStudy.algorithm_case_study_relations?.map(r => r.algorithms?.name).filter(Boolean) || [];
  const personas = caseStudy.case_study_persona_relations?.map(r => r.personas?.name).filter(Boolean) || [];
  const quantumSoftware = caseStudy.case_study_quantum_software_relations?.map(r => r.quantum_software?.name).filter(Boolean) || [];
  const quantumHardware = caseStudy.case_study_quantum_hardware_relations?.map(r => r.quantum_hardware?.name).filter(Boolean) || [];
  const quantumCompanies = caseStudy.case_study_quantum_company_relations?.map(r => r.quantum_companies?.name).filter(Boolean) || [];
  const partnerCompanies = caseStudy.case_study_partner_company_relations?.map(r => r.partner_companies?.name).filter(Boolean) || [];
  
  // Build comprehensive keywords from all related entities
  const keywords = [
    "Quantum Computing",
    "Business Applications",
    "Case Study",
    caseStudy.year ? `${caseStudy.year} Case Study` : null,
    ...industries,
    ...algorithms,
    ...quantumSoftware,
    ...quantumHardware,
    ...quantumCompanies,
    ...partnerCompanies
  ].filter(Boolean);
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": caseStudy.title,
    "description": caseStudy.description,
    "url": `${baseUrl}/case-study/${caseStudy.slug}`,
    "datePublished": caseStudy.published_at,
    "dateModified": caseStudy.updated_at || caseStudy.published_at,
    "author": {
      "@type": "Organization",
      "name": "OpenQase",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization", 
      "name": "OpenQase",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/openqase-logo.svg`
      }
    },
    "image": {
      "@type": "ImageObject",
      "url": `${baseUrl}/og-image.svg`,
      "width": 1200,
      "height": 630
    },
    "about": [
      "Quantum Computing",
      "Business Applications",
      "Case Study",
      ...industries.slice(0, 3),
      ...algorithms.slice(0, 3)
    ].filter(Boolean),
    "keywords": keywords.join(", "),
    "articleSection": "Case Studies",
    "inLanguage": "en-US",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/case-study/${caseStudy.slug}`
    },
    "mentions": [
      ...quantumCompanies.map(name => ({ "@type": "Organization", "name": name })),
      ...partnerCompanies.map(name => ({ "@type": "Organization", "name": name })),
      ...quantumSoftware.map(name => ({ "@type": "SoftwareApplication", "name": name })),
      ...quantumHardware.map(name => ({ "@type": "Product", "name": name }))
    ].filter(item => item.name),
    "isPartOf": {
      "@type": "WebSite",
      "name": "OpenQase",
      "url": baseUrl
    },
    "potentialAction": {
      "@type": "ReadAction",
      "target": `${baseUrl}/case-study/${caseStudy.slug}`
    }
  };
}

// Learning path course schema - for personas, industries, algorithms
export function getCourseSchema(content: LearningContent, courseType: 'persona' | 'industry' | 'algorithm') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com";
  
  const courseTypeLabels = {
    persona: "Role-Based Learning Path",
    industry: "Industry-Specific Learning Path", 
    algorithm: "Algorithm-Focused Learning Path"
  };
  
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": content.name,
    "description": content.description,
    "url": `${baseUrl}/paths/${courseType}/${content.slug}`,
    "courseMode": "online",
    "educationalLevel": "Professional",
    "audience": {
      "@type": "Audience",
      "audienceType": "Business Professionals"
    },
    "provider": {
      "@type": "Organization",
      "name": "OpenQase",
      "url": baseUrl
    },
    "about": [
      "Quantum Computing",
      courseTypeLabels[courseType]
    ],
    "inLanguage": "en-US",
    "isAccessibleForFree": true
  };
}

// FAQ schema for landing page - helps with "People Also Ask" results
export function getFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is quantum computing for business?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Quantum computing for business focuses on practical applications that solve real-world problems like optimization, security, and machine learning, rather than theoretical quantum physics."
        }
      },
      {
        "@type": "Question", 
        "name": "How do companies use quantum algorithms?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Companies like HSBC, Google, and Mitsui use quantum algorithms for portfolio optimization, cybersecurity, fraud detection, and supply chain optimization."
        }
      },
      {
        "@type": "Question",
        "name": "What industries benefit from quantum computing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Financial services, healthcare, energy, manufacturing, and logistics are leading adopters of quantum computing for business optimization and security applications."
        }
      }
    ]
  };
}

// Quantum Company/Organization schema
export function getQuantumEntitySchema(entity: QuantumEntity, entityType: 'quantum-companies' | 'partner-companies' | 'quantum-software' | 'quantum-hardware') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com";
  
  // Map entity types to appropriate schema types
  const schemaTypeMap = {
    'quantum-companies': 'Organization',
    'partner-companies': 'Organization',
    'quantum-software': 'SoftwareApplication',
    'quantum-hardware': 'Product'
  };
  
  const schemaType = schemaTypeMap[entityType];
  
  // Build base schema
  const baseSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": entity.name,
    "description": entity.description,
    "url": `${baseUrl}/paths/${entityType}/${entity.slug}`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/paths/${entityType}/${entity.slug}`
    }
  };
  
  // Add organization-specific fields
  if (entityType === 'quantum-companies' || entityType === 'partner-companies') {
    if (entity.website) baseSchema.sameAs = [entity.website];
    if (entity.founded_year) baseSchema.foundingDate = entity.founded_year.toString();
    if (entity.headquarters) baseSchema.location = { "@type": "Place", "name": entity.headquarters };
    if (entity.specialization) baseSchema.knowsAbout = [entity.specialization, "Quantum Computing"];
    
    // Add funding information if available
    if (entity.funding_stage) {
      baseSchema.additionalProperty = {
        "@type": "PropertyValue",
        "name": "Funding Stage",
        "value": entity.funding_stage
      };
    }
  }
  
  // Add software-specific fields
  if (entityType === 'quantum-software') {
    baseSchema.applicationCategory = "Quantum Computing Software";
    if (entity.category) baseSchema.applicationSubCategory = entity.category;
    if (entity.key_features) baseSchema.featureList = entity.key_features;
    if (entity.target_industries) {
      baseSchema.audience = {
        "@type": "Audience",
        "audienceType": entity.target_industries.join(", ")
      };
    }
  }
  
  // Add hardware-specific fields
  if (entityType === 'quantum-hardware') {
    baseSchema.category = "Quantum Computing Hardware";
    if (entity.category) baseSchema.model = entity.category;
    if (entity.key_features) {
      baseSchema.additionalProperty = entity.key_features.map(feature => ({
        "@type": "PropertyValue",
        "name": "Feature",
        "value": feature
      }));
    }
  }
  
  // Add related case studies
  const relatedCaseStudies = 
    entity.case_study_quantum_company_relations ||
    entity.case_study_quantum_software_relations ||
    entity.case_study_quantum_hardware_relations ||
    entity.case_study_partner_company_relations || [];
  
  if (relatedCaseStudies.length > 0) {
    baseSchema.mentions = relatedCaseStudies
      .filter(r => r.case_studies)
      .map(r => ({
        "@type": "Article",
        "name": r.case_studies!.title,
        "url": `${baseUrl}/case-study/${r.case_studies!.slug}`
      }));
  }
  
  return baseSchema;
}

// Blog post article schema
export function getBlogPostSchema(blogPost: BlogPost) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blogPost.title,
    "description": blogPost.description || `Blog post: ${blogPost.title}`,
    "url": `${baseUrl}/blog/${blogPost.slug}`,
    "datePublished": blogPost.published_at,
    "dateModified": blogPost.updated_at || blogPost.published_at,
    "author": {
      "@type": blogPost.author ? "Person" : "Organization",
      "name": blogPost.author || "OpenQase"
    },
    "publisher": {
      "@type": "Organization",
      "name": "OpenQase",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/openqase-logo.svg`
      }
    },
    "image": {
      "@type": "ImageObject",
      "url": `${baseUrl}/og-image.svg`,
      "width": 1200,
      "height": 630
    },
    "articleSection": blogPost.category || "Blog",
    "keywords": blogPost.tags ? blogPost.tags.join(", ") : "Quantum Computing, Business Applications",
    "inLanguage": "en-US",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${blogPost.slug}`
    },
    "isPartOf": {
      "@type": "Blog",
      "name": "OpenQase Blog",
      "url": `${baseUrl}/blog`
    }
  };
}

// WebSite schema with search action
export function getWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OpenQase",
    "description": "Quantum computing business applications platform",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "OpenQase",
      "url": baseUrl
    }
  };
}

// Breadcrumb schema for navigation clarity
export function getBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://openqase.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${baseUrl}${crumb.url}`
    }))
  };
}
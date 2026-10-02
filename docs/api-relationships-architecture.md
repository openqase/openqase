# API and Relationships Architecture

## Overview

OpenQase uses a sophisticated content relationship system that powers the interconnected nature of quantum computing case studies, algorithms, industries, personas, and other content types. This document explains how the APIs work and how relationships enable rich content discovery.

## Table of Contents
- [Core Concepts](#core-concepts)
- [API Architecture](#api-architecture)
- [Relationship System](#relationship-system)
- [Content Types](#content-types)
- [Implementation Examples](#implementation-examples)
- [Best Practices](#best-practices)

## Core Concepts

### Content-First Architecture
Every piece of content in OpenQase is a first-class entity with:
- Unique identifier (UUID)
- Human-readable slug
- Rich metadata fields
- Published/draft states
- Relationship connections

### Bidirectional Relationships
Relationships work both ways - if a case study relates to an algorithm, that algorithm also relates back to the case study. This enables discovery from any starting point.

## API Architecture

### Standardized API Pattern

All content APIs use the CMS operations layer, driven by the content-type registry:

```typescript
import {
  listContent,          // List content with pagination (published only for public reads)
  fetchContentBySlug,   // Get a single published item by slug
  deleteContent,        // Soft delete (sets deleted_at, unpublishes, revalidates)
  deleteContentMany,    // Bulk soft delete
  publishContent,       // Publish (refuses trashed rows, stamps published_at)
  unpublishContent,
} from '@/cms/operations'
```

### API Methods

Each content type API supports:

| Method | Endpoint | Purpose | Parameters |
|--------|----------|---------|------------|
| GET | `/api/[content-type]` | List all items | `page`, `pageSize`, `preview` |
| GET | `/api/[content-type]?slug=xxx` | Get single item | `slug`, `preview` |
| POST | `/api/[content-type]` | Create new item | JSON body |
| PUT | `/api/[content-type]?id=xxx` | Update item | `id`, JSON body |
| PATCH | `/api/[content-type]?id=xxx` | Update published status | `id`, `{published: boolean}` |
| DELETE | `/api/[content-type]?id=xxx` | Soft delete item | `id` |

### Common Parameters

- `preview=true`: Include unpublished content (admin only)
- `page=1`: Pagination page number
- `pageSize=10`: Items per page
- `slug=xxx`: Get specific item by slug
- `id=xxx`: Target specific item by UUID

## Relationship System

### Junction Tables

Relationships are stored in junction tables that connect two content types:

```sql
-- Example: case_study_algorithm_relations
CREATE TABLE algorithm_case_study_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  algorithm_id UUID REFERENCES algorithms(id),
  case_study_id UUID REFERENCES case_studies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- For soft delete
);
```

### Relationship Configuration

Each content type defines its relationships in `RELATIONSHIP_CONFIGS`:

```typescript
export const RELATIONSHIP_CONFIGS = {
  algorithms: {
    caseStudies: {
      junctionTable: 'algorithm_case_study_relations',
      contentIdField: 'algorithm_id',
      relatedIdField: 'case_study_id',
      relatedTable: 'case_studies'
    },
    industries: {
      junctionTable: 'algorithm_industry_relations',
      contentIdField: 'algorithm_id',
      relatedIdField: 'industry_id',
      relatedTable: 'industries'
    }
  },
  // ... more content types
}
```

### Bidirectional Nature

The same junction table serves both directions:

```typescript
// On an Algorithm page - shows related case studies
RELATIONSHIP_CONFIGS.algorithms.caseStudies

// On a Case Study page - shows related algorithms  
RELATIONSHIP_CONFIGS.caseStudies.algorithms
// Both use the same junction table: algorithm_case_study_relations
```

## Content Types

### Primary Content Types

1. **Case Studies** (`case_studies`)
   - Central content type
   - Relates to: algorithms, industries, personas, quantum software/hardware, companies

2. **Algorithms** (`algorithms`)
   - Quantum computing techniques
   - Relates to: case studies, industries, personas

3. **Industries** (`industries`)
   - Business sectors
   - Relates to: case studies, algorithms, personas

4. **Personas** (`personas`)
   - User roles/stakeholders
   - Relates to: case studies, algorithms, industries

### Secondary Content Types (Added 2025)

5. **Quantum Software** (`quantum_software`)
   - Software platforms and frameworks
   - Relates to: case studies

6. **Quantum Hardware** (`quantum_hardware`)
   - Hardware systems and processors
   - Relates to: case studies

7. **Quantum Companies** (`quantum_companies`)
   - Companies in quantum space
   - Relates to: case studies

8. **Partner Companies** (`partner_companies`)
   - Partnership organizations
   - Relates to: case studies

### Blog System

9. **Blog Posts** (`blog_posts`)
   - Self-referential relationships for related posts

## Implementation Examples

### Creating Content with Relationships

```typescript
// POST /api/case-studies
{
  "title": "Quantum Optimization for Supply Chain",
  "slug": "quantum-supply-chain",
  "description": "...",
  "published": true,
  // Direct relationships via IDs
  "algorithms[]": ["uuid-1", "uuid-2"],
  "industries[]": ["uuid-3"],
  "personas[]": ["uuid-4", "uuid-5"]
}
```

The API automatically:
1. Creates the case study
2. Inserts junction table records
3. Returns the complete item with relationships

### Fetching Content with Relationships

```typescript
// GET /api/case-studies?slug=quantum-supply-chain
// Returns:
{
  "id": "uuid-x",
  "title": "Quantum Optimization for Supply Chain",
  "related_algorithms": [
    {"id": "uuid-1", "name": "QAOA", "slug": "qaoa"},
    {"id": "uuid-2", "name": "VQE", "slug": "vqe"}
  ],
  "related_industries": [
    {"id": "uuid-3", "name": "Logistics", "slug": "logistics"}
  ],
  "related_personas": [
    {"id": "uuid-4", "name": "CTO", "slug": "cto"},
    {"id": "uuid-5", "name": "Data Scientist", "slug": "data-scientist"}
  ]
}
```

### Querying Related Content

To find all case studies related to a specific algorithm:

```typescript
// In the API handler
const { data: relations } = await supabase
  .from('algorithm_case_study_relations')
  .select('case_study_id')
  .eq('algorithm_id', algorithmId);

const caseStudyIds = relations.map(r => r.case_study_id);

const { data: caseStudies } = await fetchContentItems({
  contentType: 'case_studies',
  filters: { id: caseStudyIds }
});
```

## Best Practices

### 1. Always Use Content Management Utilities

Don't write direct Supabase queries for standard operations:

```typescript
// ❌ Bad - Direct query
const { data } = await supabase.from('algorithms').select('*');

// ✅ Good - Use utilities
const { data } = await fetchContentItems({ 
  contentType: 'algorithms' 
});
```

### 2. Handle Relationships Atomically

When updating relationships, the system:
1. Deletes ALL existing relationships for that content
2. Inserts the new set of relationships
3. This ensures data consistency

### 3. Respect Published States

- Public APIs should NEVER expose unpublished content
- Use `includeUnpublished: false` for public queries
- Only admin interfaces should set `preview=true`

### 4. Maintain Backward Compatibility

During transitions, support both old and new formats:

```typescript
// Support both relationship data and legacy arrays
const quantumSoftware = caseStudy.quantum_software_relations?.length > 0
  ? caseStudy.quantum_software_relations
  : caseStudy.quantum_software; // Legacy TEXT[] field
```

### 5. Use Proper Error Handling

All APIs should return consistent error responses:

```typescript
// 404 - Not Found
{ error: 'Algorithm not found' }

// 400 - Bad Request  
{ error: 'ID is required' }

// 500 - Server Error
{ error: 'Failed to fetch algorithms' }
```

### 6. Implement Soft Delete

Never hard delete content immediately:

```typescript
// Soft delete marks deleted_at timestamp
await deleteContentItem({
  contentType: 'algorithms',
  id: itemId,
  hardDelete: false // Default
});

// Recovery is possible within 30 days
await recoverContentItem({
  contentType: 'algorithms',
  id: itemId
});
```

## Database Schema

### Content Table Pattern

All content tables follow this structure:

```sql
CREATE TABLE [content_type] (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  
  -- Content
  name TEXT NOT NULL,           -- Display name
  description TEXT,              -- Short description
  main_content TEXT,            -- Long form content (Markdown)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  
  -- Content-specific fields
  [additional_fields...]
);
```

### Junction Table Pattern

```sql
CREATE TABLE [content1]_[content2]_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  [content1]_id UUID REFERENCES [content1](id) ON DELETE CASCADE,
  [content2]_id UUID REFERENCES [content2](id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Ensure uniqueness
  UNIQUE([content1]_id, [content2]_id)
);

-- Indexes for performance
CREATE INDEX idx_[junction]_[content1] ON [junction]([content1]_id);
CREATE INDEX idx_[junction]_[content2] ON [junction]([content2]_id);
```

## Frontend Integration

### Displaying Related Content

The `professional-case-study-layout.tsx` component renders relationships:

```typescript
// Helper function to render entity links
const renderEntityLinks = (
  entities: any[], 
  basePath: string,
  icon?: React.ComponentType
) => {
  return entities.map(entity => (
    <Link
      key={entity.id}
      href={`${basePath}/${entity.slug}`}
      className="hover:text-primary transition-colors"
    >
      {icon && <Icon className="w-4 h-4" />}
      {entity.name}
    </Link>
  ));
};
```

### Content Discovery Flow

1. User views a case study
2. Sees related algorithms, industries, personas as clickable links
3. Clicks on an algorithm
4. Algorithm page shows all case studies using that algorithm
5. User discovers more relevant content

## Performance Considerations

### Query Optimization

- Junction tables have indexes on both foreign keys
- Complex queries with multiple joins execute in ~1.6ms
- Use pagination to limit result sets
- Fetch relationships only when needed

### Caching Strategy

- Static Site Generation caches pages at build time
- ISR (Incremental Static Regeneration) updates content
- API responses can be cached at CDN level
- Relationship data rarely changes, good cache candidate

## Troubleshooting

### Common Issues

1. **Missing Relationships**
   - Check junction table has records
   - Verify both content items are published
   - Ensure relationship config is defined

2. **Slow Queries**
   - Check indexes exist on junction tables
   - Limit number of relationships fetched
   - Use pagination for large result sets

3. **Inconsistent Data**
   - Run integrity check on junction tables
   - Verify no orphaned relationships
   - Check soft delete status

## Future Enhancements

### Planned Improvements

1. **Explicit Content Type Parameters**
   - Remove field-based type detection
   - Pass content type explicitly through functions

2. **Bulk Operations**
   - Batch create/update relationships
   - Bulk publish/unpublish

3. **Relationship Weights**
   - Score relationship strength
   - Sort by relevance

4. **Graph Queries**
   - Multi-hop relationship traversal
   - Content recommendation engine

## Summary

The OpenQase relationship system enables:
- Rich content interconnections
- Bidirectional discovery paths
- Consistent API patterns
- Scalable architecture
- Maintainable codebase

By following these patterns and best practices, developers can easily add new content types and relationships while maintaining system integrity and performance.
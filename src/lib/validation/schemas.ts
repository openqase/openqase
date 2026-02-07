import { z } from 'zod';

// Base validation schemas
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200, 'Slug must be less than 200 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens');

const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(500, 'Title must be less than 500 characters')
  .trim();

const descriptionSchema = z
  .string()
  .max(1000, 'Description must be less than 1000 characters')
  .optional()
  .nullable();

const contentSchema = z
  .string()
  .max(50000, 'Content must be less than 50,000 characters')
  .optional()
  .nullable();

const urlSchema = z
  .string()
  .url('Must be a valid URL')
  .optional()
  .nullable()
  .or(z.literal(''));

const stringArraySchema = z
  .array(z.string().trim().min(1))
  .optional()
  .default([]);

const idArraySchema = z
  .array(z.string().uuid('Invalid ID format'))
  .optional()
  .default([]);

// Case Studies validation schema
export const caseStudySchema = z.object({
  id: z.string().uuid('Invalid ID format').optional().nullable(),
  title: titleSchema,
  slug: slugSchema,
  description: descriptionSchema,
  main_content: contentSchema,
  url: urlSchema,
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  year: z.number().int().min(1990).max(2030).optional(),
  partner_companies: stringArraySchema,
  quantum_companies: stringArraySchema,
  quantum_hardware: stringArraySchema,
  quantum_software: stringArraySchema,
  algorithms: idArraySchema,
  industries: idArraySchema,
  personas: idArraySchema,
  academic_references: z.string().max(10000, 'Academic references must be less than 10,000 characters').optional().nullable(),
  resource_links: z.array(z.object({
    url: z.string().url('Must be a valid URL'),
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional()
  })).optional().default([])
});

// Blog Posts validation schema
export const blogPostSchema = z.object({
  id: z.string().uuid('Invalid ID format').optional().nullable(),
  title: titleSchema,
  slug: slugSchema,
  description: descriptionSchema,
  content: contentSchema,
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  author: z.string().max(100, 'Author name must be less than 100 characters').optional().nullable(),
  featured_image: z.string().max(500, 'Featured image URL must be less than 500 characters').optional().nullable(),
  published_at: z.string().datetime('Invalid date format').optional().nullable(),
  tags: stringArraySchema,
  category: z.string().max(100, 'Category must be less than 100 characters').optional().nullable()
});

// Algorithm validation schema
export const algorithmSchema = z.object({
  id: z.string().uuid('Invalid ID format').optional().nullable(),
  name: titleSchema,
  slug: slugSchema,
  description: descriptionSchema,
  main_content: contentSchema,
  published: z.boolean().default(false),
  quantum_advantage: z.string().max(10000, 'Quantum advantage must be less than 10,000 characters').optional().nullable(),
  use_cases: stringArraySchema,
  complexity: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().nullable(),
  quantum_volume_required: z.number().int().min(1).optional().nullable(),
  classical_preprocessing: z.boolean().default(false),
  error_mitigation_required: z.boolean().default(false)
});

// Industry validation schema
export const industrySchema = z.object({
  id: z.string().uuid('Invalid ID format').optional().nullable(),
  name: titleSchema,
  slug: slugSchema,
  description: descriptionSchema,
  main_content: contentSchema,
  icon: z.string().max(100, 'Icon must be less than 100 characters').optional().nullable(),
  published: z.boolean().default(false)
});

// Persona validation schema
export const personaSchema = z.object({
  id: z.string().uuid('Invalid ID format').optional().nullable(),
  name: titleSchema,
  slug: slugSchema,
  description: descriptionSchema,
  main_content: contentSchema,
  role: z.string().max(200, 'Role must be less than 200 characters').optional().nullable(),
  published: z.boolean().default(false),
  experience_level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().nullable(),
  technical_background: z.string().max(200).optional().nullable()
});

// Newsletter subscription validation schema
export const newsletterSubscriptionSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
  source: z.string().max(50).optional().default('website')
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  includeUnpublished: z.coerce.boolean().default(false)
});

export const searchParamsSchema = z.object({
  slug: z.string().optional(),
  algorithm: z.string().optional(),
  industry: z.string().optional(),
  persona: z.string().optional()
}).merge(paginationSchema);

// Validation helper functions
export function validateFormData<T>(schema: z.ZodSchema<T>, formData: FormData): { data: T; errors: null } | { data: null; errors: z.ZodError } {
  try {
    // Convert FormData to plain object
    const formObject: any = {};
    
    for (const [key, value] of formData.entries()) {
      if (key.endsWith('[]')) {
        // Handle array fields
        const arrayKey = key.slice(0, -2);
        if (!formObject[arrayKey]) formObject[arrayKey] = [];
        formObject[arrayKey].push(value);
      } else if (key === 'published' || key === 'featured') {
        // Handle boolean fields from form submissions
        formObject[key] = value === 'on' || value === 'true';
      } else if (key.includes('_') && ['partner_companies', 'quantum_companies', 'quantum_hardware', 'quantum_software'].includes(key)) {
        // Handle comma-separated array fields
        formObject[key] = value ? (value as string).split(',').map(item => item.trim()).filter(Boolean) : [];
      } else if (key === 'year') {
        // Handle numeric fields
        formObject[key] = value ? parseInt(value as string) : undefined;
      } else if (key === 'resource_links') {
        // Handle JSON fields
        try {
          formObject[key] = value ? JSON.parse(value as string) : [];
        } catch {
          formObject[key] = [];
        }
      } else {
        formObject[key] = value || undefined;
      }
    }
    
    const data = schema.parse(formObject);
    return { data, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, errors: error };
    }
    throw error;
  }
}

export function validateSearchParams(searchParams: URLSearchParams) {
  const paramsObject = Object.fromEntries(searchParams.entries());
  return searchParamsSchema.safeParse(paramsObject);
}

export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  for (const error of errors.errors) {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  }
  
  return formattedErrors;
}
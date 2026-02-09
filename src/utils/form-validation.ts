/**
 * Types for form validation
 */
export type ValidationIssue = {
  name: string;
  label: string;
};

export type ValidationIssues = Record<string, ValidationIssue[]>;

export type ValidationRule = {
  field: string;
  tab: string;
  label: string;
  validator: (value: any) => boolean;
};

/**
 * Validates form values against validation rules
 * 
 * @param values - The form values to validate
 * @param validationRules - The validation rules to apply
 * @returns An object with validation issues grouped by tab
 */
export function validateFormValues({
  values,
  validationRules
}: {
  values: Record<string, any>;
  validationRules: ValidationRule[];
}): ValidationIssues {
  const issues: ValidationIssues = {};
  
  for (const rule of validationRules) {
    const { field, tab, label, validator } = rule;
    const value = values[field];
    
    if (!validator(value)) {
      if (!issues[tab]) {
        issues[tab] = [];
      }
      
      issues[tab].push({
        name: field,
        label
      });
    }
  }
  
  return issues;
}

/**
 * Calculates completion percentage based on validation rules
 * 
 * @param values - The form values to check
 * @param validationRules - The validation rules to apply
 * @returns The percentage of rules that pass validation (0-100)
 */
export function calculateCompletionPercentage({
  values,
  validationRules
}: {
  values: Record<string, any>;
  validationRules: ValidationRule[];
}): number {
  const totalRules = validationRules.length;
  if (totalRules === 0) return 100; // If no rules, consider it complete
  
  const completedRules = validationRules.filter(rule => rule.validator(values[rule.field])).length;
  
  return Math.round((completedRules / totalRules) * 100);
}

/**
 * Checks if a specific tab is complete based on validation rules
 * 
 * @param values - The form values to check
 * @param validationRules - The validation rules to apply
 * @param tabName - The name of the tab to check
 * @returns True if all rules for the tab pass validation
 */
export function isTabComplete({
  values,
  validationRules,
  tabName
}: {
  values: Record<string, any>;
  validationRules: ValidationRule[];
  tabName: string;
}): boolean {
  const tabRules = validationRules.filter(rule => rule.tab === tabName);
  if (tabRules.length === 0) return true; // If no rules for this tab, consider it complete
  
  return tabRules.every(rule => rule.validator(values[rule.field]));
}

/**
 * Common validators for form fields
 */
export const validators = {
  /**
   * Checks if a value is not empty
   */
  required: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'number') {
      return !isNaN(value);
    }
    return !!value;
  },
  
  /**
   * Checks if a string has at least a minimum length
   */
  minLength: (length: number) => (value: string): boolean => {
    if (typeof value !== 'string') return false;
    return value.trim().length >= length;
  },
  
  /**
   * Checks if a string doesn't exceed a maximum length
   */
  maxLength: (length: number) => (value: string): boolean => {
    if (typeof value !== 'string') return false;
    return value.trim().length <= length;
  },
  
  /**
   * Checks if a string is a valid slug (lowercase, alphanumeric, hyphens)
   */
  isSlug: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  },
  
  /**
   * Checks if a string is a valid email address
   */
  isEmail: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  
  /**
   * Checks if a string is a valid URL
   */
  isUrl: (value: string): boolean => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Checks if a value matches a regular expression
   */
  matches: (pattern: RegExp) => (value: string): boolean => {
    if (typeof value !== 'string') return false;
    return pattern.test(value);
  },
  
  /**
   * Checks if a value is a number
   */
  isNumber: (value: any): boolean => {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') return !isNaN(Number(value));
    return false;
  },
  
  /**
   * Checks if a number is greater than a minimum value
   */
  min: (min: number) => (value: number): boolean => {
    if (typeof value !== 'number') return false;
    return value >= min;
  },
  
  /**
   * Checks if a number is less than a maximum value
   */
  max: (max: number) => (value: number): boolean => {
    if (typeof value !== 'number') return false;
    return value <= max;
  },
  
  /**
   * Combines multiple validators with AND logic
   */
  and: (...validators: ((value: any) => boolean)[]) => (value: any): boolean => {
    return validators.every(validator => validator(value));
  },
  
  /**
   * Combines multiple validators with OR logic
   */
  or: (...validators: ((value: any) => boolean)[]) => (value: any): boolean => {
    return validators.some(validator => validator(value));
  }
};

/**
 * Creates validation rules for common content types
 * 
 * @param contentType - The type of content being validated
 * @returns An array of validation rules for the content type
 */
export function createContentValidationRules(contentType: 'algorithm' | 'persona' | 'industry' | 'case_study' | 'blog_post' | 'quantum_companies' | 'quantum_software' | 'quantum_hardware' | 'partner_companies'): ValidationRule[] {
  const commonRules: ValidationRule[] = [
    {
      field: ['algorithm', 'persona', 'industry', 'quantum_companies', 'quantum_software', 'quantum_hardware', 'partner_companies'].includes(contentType) ? 'name' : 'title',
      tab: 'basic',
      label: 'Name is required',
      validator: validators.required
    },
    {
      field: 'slug',
      tab: 'basic',
      label: 'Slug is required and must be valid',
      validator: validators.and(validators.required, validators.isSlug)
    },
    {
      field: 'description',
      tab: 'basic',
      label: 'Description is required',
      validator: validators.required
    }
  ];
  
  // Content-specific rules
  switch (contentType) {
    case 'algorithm':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        },
        {
          field: 'related_case_studies',
          tab: 'relationships',
          label: 'At least one related case study is required',
          validator: (value) => Array.isArray(value) && value.length > 0
        }
      ];
      
    case 'persona':
      return [
        ...commonRules,
        {
          field: 'industry',
          tab: 'relationships',
          label: 'At least one industry is required',
          validator: (value) => Array.isArray(value) && value.length > 0
        }
      ];
      
    case 'industry':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        }
      ];
      
    case 'case_study':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        },
        {
          field: 'year',
          tab: 'basic',
          label: 'Year must be between 1990 and 2030',
          validator: validators.and(validators.isNumber, validators.min(1990), validators.max(2030))
        },
        {
          field: 'algorithms',
          tab: 'classifications',
          label: 'At least one algorithm is required',
          validator: (value) => Array.isArray(value) && value.length > 0
        },
        {
          field: 'industries',
          tab: 'classifications',
          label: 'At least one industry is required',
          validator: (value) => Array.isArray(value) && value.length > 0
        }
      ];
      
    case 'blog_post':
      return [
        ...commonRules,
        {
          field: 'content',
          tab: 'content',
          label: 'Content is required',
          validator: validators.required
        },
        {
          field: 'author',
          tab: 'basic',
          label: 'Author is required',
          validator: validators.required
        },
        {
          field: 'category',
          tab: 'basic',
          label: 'Category is required',
          validator: validators.required
        },
        {
          field: 'tags',
          tab: 'basic',
          label: 'At least one tag is required',
          validator: (value) => Array.isArray(value) && value.length > 0
        },
        {
          field: 'featured_image',
          tab: 'classifications',
          label: 'Featured image is recommended',
          validator: validators.or(validators.required, () => true) // Optional but tracked
        }
      ];
      
    case 'quantum_companies':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        }
      ];
      
    case 'quantum_software':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        }
      ];
      
    case 'quantum_hardware':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        }
      ];
      
    case 'partner_companies':
      return [
        ...commonRules,
        {
          field: 'main_content',
          tab: 'content',
          label: 'Main content is required',
          validator: validators.required
        }
      ];
      
    default:
      return commonRules;
  }
}
# Developer Guide: /admin CMS

## Overview

This guide explains the architecture and development practices for the `/admin` Content Management System (CMS) built within the Next.js application. The CMS allows authenticated users to create, read, update, and delete various content types (e.g., Blog Posts, Case Studies, Personas).

The CMS has recently undergone refactoring (as detailed in `cms-refactor-plan.md`) to leverage modern Next.js features like the App Router and Server Actions, aiming for improved type safety, developer experience, and scalability.

## Architecture

### Framework & Structure

*   **Framework:** Next.js 15 (App Router)
*   **Core Directory:** `src/app/admin/`
*   **Content Type Structure:** Each content type resides in its own directory, e.g., `src/app/admin/blog-posts/`. This typically contains:
    *   `page.tsx`: Server Component for listing content items.
    *   `[id]/page.tsx`: Server Component for loading a specific content item for editing.
    *   `[id]/client.tsx`: Client Component containing the main form logic and UI.
    *   `[id]/actions.ts`: Server Actions responsible for mutations (create, update, delete, publish/unpublish).
*   **Server Actions:** Used for all mutations, replacing the previous API route layer (`src/app/api/[content-type]/`). Server Actions directly interact with the Supabase database using service role privileges.
*   **Components:** Leverages a mix of Server Components (for data fetching and initial rendering) and Client Components (for interactive forms).

### Data Layer (Supabase)

*   **Database:** Supabase Postgres.
*   **Client Utilities:** All Supabase client interactions are centralized in `src/lib/supabase.ts`. This module provides helpers like:
    *   `getSupabaseServerClient`: For use in Server Components (read operations).
    *   `getSupabaseServiceClientRole`: For use in Server Actions (write operations).
    *   `getSupabaseBrowserClient`: For potential client-side interactions (use sparingly).
*   **Schema:** Content types are defined as tables in Supabase. Relationships (many-to-many) are managed via dedicated junction tables (e.g., `algorithm_case_study_relations`).

### Authentication

*   **Mechanism:** the Next.js proxy (formerly middleware) (`src/proxy.ts`) protects the `/admin` routes, ensuring only authenticated users can access the CMS. It likely uses Supabase Auth helpers.

## Content Management Workflow

The CMS follows a standardized pattern for managing content, exemplified by the single-page form approach implemented across most content types.

### 1. Listing Content (`/admin/[content-type]`)

*   The `page.tsx` Server Component fetches a list of content items for the specific type using `getSupabaseServerClient`.
*   It renders a table or list view, often including links to edit individual items and a button to create new ones.
*   Appropriate caching strategies (`export const dynamic = 'force-dynamic';` or tag-based revalidation) are used to ensure data freshness after mutations.

### 2. Creating New Content (`/admin/[content-type]/new`)

*   Navigating to a creation page (often handled by the list page) renders the form (`client.tsx`) within the `[id]/page.tsx` structure, potentially with a special `id` like `new`.
*   The user fills out the form fields.
*   Clicking "Save" triggers a `createItem` (or similar) Server Action defined in `actions.ts`.
*   The Server Action:
    *   Validates the input using Zod schemas.
    *   Inserts the new record into the corresponding Supabase table using `getSupabaseServiceClientRole`.
    *   Handles relationship updates (inserting records into junction tables).
    *   Calls `revalidatePath` or `revalidateTag` to invalidate caches.
    *   Redirects the user to the edit page for the newly created item (`/admin/[content-type]/[new-item-id]`)

### 3. Editing Existing Content (`/admin/[content-type]/[id]`)

*   The `[id]/page.tsx` Server Component fetches the specific content item using `getSupabaseServerClient` based on the `id` parameter.
*   It also fetches related data (e.g., from junction tables).
*   It passes the fetched data to the `client.tsx` component.
*   The `client.tsx` component renders the single-page form, populating fields with the fetched data. Relationships are typically handled by `RelationshipSelector` components.
*   User modifies the form.
*   Clicking "Save" triggers an `updateItem` (or similar) Server Action.
*   The Server Action:
    *   Validates input using Zod schemas.
    *   Updates the record in Supabase using `getSupabaseServiceClientRole`.
    *   Manages relationship changes (deleting old and inserting new junction table records).
    *   Calls `revalidatePath` or `revalidateTag`.
    *   Often redirects or simply allows the page to refresh with updated data.

### 4. Publishing/Unpublishing Content

*   **Mechanism:** Content status is managed by a field in the Supabase table (e.g., `published: boolean` or potentially a `status: text` field like 'draft', 'published').
*   **Trigger:** Dedicated "Publish" / "Unpublish" buttons within the `client.tsx` form.
*   **Action:** These buttons trigger specific Server Actions (e.g., `publishItem`, `unpublishItem`) defined in `actions.ts`.
*   **Logic:** The Server Action updates the status field for the specific item ID in Supabase using `getSupabaseServiceClientRole`.
*   **Revalidation:** The action calls `revalidatePath` or `revalidateTag` to ensure both the admin list/edit pages *and* public-facing pages reflect the change.

## Key Components & Patterns

### Server Components (`page.tsx`)

*   Responsible for initial data fetching using `async/await` and Supabase server clients.
*   Render the basic page structure and pass initial data down to Client Components.
*   Handle route parameters (e.g., `[id]`)

### Client Components (`client.tsx`)

*   Contain interactive elements like forms (`<form>`, `<input>`, etc.).
*   Use React hooks (`useState`, `useEffect`).
*   Render the form UI based on props received from Server Components.
*   Invoke Server Actions via the `action` prop on the `<form>` element or form submission handlers.

### Server Actions (`actions.ts`)

*   Defined with the `"use server";` directive.
*   Contain the core mutation logic (CRUD operations).
*   Perform input validation (Zod).
*   Interact directly with Supabase using the service role client.
*   Handle cache revalidation (`revalidatePath`, `revalidateTag`).
*   Handle redirects (`redirect`).

### Form Validation & Content Completeness

The CMS includes a comprehensive form validation system that serves two main purposes:

1. **Content Completeness Tracking**: Shows administrators how "complete" their content is with a visual percentage indicator
2. **Publish Validation**: Prevents publishing of incomplete content by blocking the publish button until all required fields are filled

#### Validation System Components

**File:** `/src/utils/form-validation.ts`

- `createContentValidationRules()`: Defines validation rules for each content type
- `calculateCompletionPercentage()`: Calculates completion percentage (0-100%)
- `validateFormValues()`: Checks form values against validation rules
- `validators`: Collection of common validation functions

#### Content Type Validation Rules

Each content type has specific required fields defined in the validation rules:

```typescript
// Example: Quantum Hardware validation rules
case 'quantum_hardware':
  return [
    ...commonRules,  // name, slug, description (always required)
    {
      field: 'main_content',
      tab: 'content',
      label: 'Main content is required',
      validator: validators.required
    }
  ];
```

**Common Required Fields** (for all content types):
- `name` (or `title` for case studies/blog posts)
- `slug` (must be URL-friendly)
- `description`

**Content-Specific Required Fields:**
- **Algorithms**: `main_content`, `related_case_studies`
- **Case Studies**: `main_content`, `year`, `algorithms`, `industries`
- **Blog Posts**: `content`, `author`, `category`, `tags`
- **Quantum Hardware**: `main_content`
- **Quantum Software**: `main_content`
- **Quantum Companies**: `main_content`
- **Partner Companies**: `main_content`

#### Customizing Required Fields

To add or modify required fields for a content type:

1. **Edit validation rules** in `/src/utils/form-validation.ts`:
```typescript
case 'quantum_hardware':
  return [
    ...commonRules,
    {
      field: 'manufacturer',        // Field name
      tab: 'basic',                 // Tab for grouping errors
      label: 'Manufacturer is required',  // Error message
      validator: validators.required       // Validation function
    },
    {
      field: 'qubit_count',
      tab: 'technical',
      label: 'Valid qubit count required',
      validator: validators.and(validators.required, validators.isNumber)
    }
  ];
```

2. **Available validators:**
```typescript
validators.required          // Field must not be empty
validators.isNumber         // Must be a valid number
validators.isUrl           // Must be valid URL  
validators.isEmail         // Must be valid email
validators.minLength(10)   // Minimum 10 characters
validators.maxLength(500)  // Maximum 500 characters
validators.isSlug          // Valid URL slug format
validators.and(...)        // All validators must pass
validators.or(...)         // Any validator can pass
```

3. **Custom validators:**
```typescript
{
  field: 'year',
  validator: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 1990 && num <= 2030;
  }
}
```

#### Implementation in Forms

Admin forms use the validation system as follows:

```typescript
// In [id]/client.tsx
import { createContentValidationRules, calculateCompletionPercentage, validateFormValues } from '@/utils/form-validation'

// Setup validation
const validationRules = createContentValidationRules('quantum_hardware')
const completionPercentage = calculateCompletionPercentage({ values, validationRules })

// Content completeness indicator
<ContentCompleteness percentage={completionPercentage} />

// Publish validation
const validateContent = () => {
  const issues = validateFormValues({ values, validationRules })
  return Object.keys(issues).length === 0 ? true : issues
}

<PublishButton validateContent={validateContent} />
```

#### Validation Effects

When validation rules are not met:
- **Content Completeness**: Percentage drops below 100%
- **Publish Button**: Becomes disabled with "Complete required fields" message
- **Toast Notifications**: Show specific validation errors when publish is attempted

The validation system ensures content quality and consistency across the platform while providing clear feedback to content creators.

### Relationship Handling (Standardized Approach)

*   **Junction Tables:** All many-to-many relationships use dedicated junction tables (e.g., `content_type_a_content_type_b_relations`).
*   **`RelationshipSelector` Component:** A reusable client component for selecting related items.
    *   Uses `itemValueKey="id"` to work directly with item IDs.
*   **Server Actions Logic:**
    *   Accept arrays of related IDs directly from the form data.
    *   Compare the submitted IDs with existing relationships in the junction table.
    *   Calculate records to delete (present in DB, not in submission) and records to insert (present in submission, not in DB).
    *   Perform deletions and insertions in the relevant junction table.

### Caching & Revalidation

*   **Goal:** Ensure data consistency between admin actions and public-facing pages.
*   **Mechanism:** Next.js's built-in caching and revalidation features.
*   **Implementation:**
    *   Server Actions call `revalidatePath('/admin/[content-type]')`, `revalidatePath('/admin/[content-type]/[id]')`, and relevant public page paths (e.g., `/blog`, `/blog/[slug]`) after successful mutations.
    *   Alternatively, tag-based revalidation (`revalidateTag('content-type')`) can be used if data fetching functions are tagged appropriately.
    *   List pages (`/admin/[content-type]/page.tsx`) might use `export const dynamic = 'force-dynamic';` to always fetch fresh data or rely on tag-based revalidation.

## Extending the CMS

### Adding a New Content Type (e.g., "Products")

1.  **Database:** Create the `products` table in Supabase, including necessary fields (name, description, price, `published` flag, etc.). Define any relationship junction tables (e.g., `product_category_relations`).
2.  **Directory:** Create `src/app/admin/products/`.
3.  **List View (`page.tsx`):** Create `src/app/admin/products/page.tsx`. Fetch and display products from Supabase. Add a "Create New Product" link/button.
4.  **Edit/Create View (`[id]/page.tsx`):** Create `src/app/admin/products/[id]/page.tsx`. Fetch a single product by ID (or handle the 'new' case). Pass data to the client component.
5.  **Form (`[id]/client.tsx`):** Create `src/app/admin/products/[id]/client.tsx`. Build the form with inputs for product fields and any `RelationshipSelector` components.
6.  **Server Actions (`[id]/actions.ts`):** Create `src/app/admin/products/[id]/actions.ts` with `"use server";`.
    *   Define Zod schema for validation.
    *   Implement `createProduct`, `updateProduct`, `publishProduct`, `unpublishProduct` actions.
    *   Include Supabase calls (insert, update).
    *   Add relationship handling logic for junction tables.
    *   Include `revalidatePath` / `revalidateTag` calls for relevant paths (admin and public).
    *   Handle redirects.
7.  **Middleware:** Ensure `src/proxy.ts` correctly protects the new `/admin/products/**` routes.
8.  **Types:** Add relevant TypeScript types for the new content type.

## Best Practices & Gotchas

*   **Consolidated Supabase Client:** Always import Supabase clients from `src/lib/supabase.ts`. Use the correct client for the context (server component, server action, browser).
*   **Service Role Client:** Use `getSupabaseServiceClientRole` *only* within Server Actions where elevated privileges are necessary and secure.
*   **Validation:** Always validate input in Server Actions using Zod schemas before database operations.
*   **Revalidation:** Be thorough with `revalidatePath` or `revalidateTag` calls. Ensure *all* affected pages (admin and public) are revalidated after mutations.
*   **Relationship IDs:** Standardize on using IDs (`itemValueKey="id"`) for relationship selectors and handle IDs directly in Server Actions. Avoid unnecessary slug-to-ID conversions.
*   **Error Handling:** Implement robust error handling within Server Actions (e.g., using try/catch blocks) and provide feedback to the user on the client-side form. 
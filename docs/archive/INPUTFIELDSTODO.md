# Input Field Styling Unification Plan - Option A: "Subtle Sunken"

## Executive Summary
Implement a consistent "sunken field" appearance across all form inputs to create visual hierarchy and improve the admin interface design coherence. All editable fields will use the same background treatment, creating a unified mental model for users.

## Current Problem
- **Input** components use `bg-transparent` (shows card background through)
- **Textarea** components use `bg-background` (explicitly uses page background)
- This creates inconsistent visual appearance in dark mode:
  - Inputs appear lighter grey (#292929 from card background)
  - Textareas appear nearly black (#1a1a1a from page background)

## Design Specification

### Visual Hierarchy
```
Page Background (--background) → Card (raised) → Input Fields (sunken)
```

### Color Values
**Light Mode:**
- Card background: `0 0% 100%` (#ffffff)
- Input background: `0 0% 91%` (#e8e8e8 - using --surface-sunken)
- Creates subtle recession effect

**Dark Mode:**
- Card background: `0 0% 16%` (#292929)
- Input background: `0 0% 9%` (#171717 - using --surface-sunken)
- Maintains depth while keeping fields visible

### Consistent Properties
- Border: `border-2 border-input` (already consistent)
- Focus state: `focus-visible:ring-2 focus-visible:ring-ring`
- Disabled state: `disabled:opacity-50`
- Transition: `transition-colors`

## Components to Update

### Primary Form Components
1. **Input** (`/src/components/ui/input.tsx`)
   - Change: `bg-transparent` → `bg-surface-sunken`
   - Current: Line 11

2. **Textarea** (`/src/components/ui/textarea.tsx`)
   - Change: `bg-background` → `bg-surface-sunken`
   - Current: Line 13

3. **Select** (`/src/components/ui/select.tsx`)
   - Change: `bg-background` → `bg-surface-sunken`
   - Current: Line 22 (SelectTrigger)

### Secondary Components (Need Investigation)
4. **CommandInput** (`/src/components/ui/command.tsx`)
   - Currently: `bg-transparent` (Line 47)
   - Consider if this should match or remain transparent for dropdown context

5. **TagInput** (`/src/components/ui/tag-input.tsx`)
   - Uses embedded input element
   - Verify background styling consistency

6. **RelationshipSelector** (`/src/components/admin/RelationshipSelector.tsx`)
   - Uses Command/Popover components
   - Ensure trigger button matches other inputs

### Components to Leave As-Is
- **Checkbox** - Different interaction model, not a text input
- **Switch** - Toggle component, not a text input
- **Radio** - Selection component, not a text input

## Implementation Steps

### Step 1: Update Tailwind Configuration
Add utility class for surface-sunken if not already available:
```css
/* Ensure bg-surface-sunken maps to var(--surface-sunken) */
```

### Step 2: Update Core Components
1. Update Input component
2. Update Textarea component  
3. Update Select component
4. Test in both light and dark modes

### Step 3: Update Complex Components
1. Review CommandInput behavior
2. Update if appropriate for context
3. Test dropdown/popover scenarios

### Step 4: Visual QA
1. Test all admin forms:
   - `/admin/personas/[id]`
   - `/admin/case-studies/[id]`
   - `/admin/algorithms/[id]`
   - `/admin/industries/[id]`
   - `/admin/blog/[id]`
2. Verify consistency across all form types
3. Check state variations:
   - Empty
   - Filled
   - Focused
   - Disabled
   - Error states (if applicable)

### Step 5: Documentation
1. Update component documentation
2. Add design system notes about form field styling
3. Document the visual hierarchy principle

## Testing Checklist
- [ ] All text inputs have consistent sunken appearance
- [ ] Light mode provides subtle but visible recession
- [ ] Dark mode maintains readability with proper contrast
- [ ] Focus states work correctly
- [ ] Disabled states are visually distinct
- [ ] Complex components (selects, command inputs) work properly
- [ ] No accessibility regressions (contrast ratios maintained)

## Rollback Plan
If issues arise, revert by:
1. Input: Change back to `bg-transparent`
2. Textarea: Change back to `bg-background`
3. Select: Change back to `bg-background`

## Success Criteria
- All form fields appear visually consistent
- Users perceive fields as editable with the same interaction model
- No confusion between different input types based on background color
- Maintains or improves accessibility standards

## Notes
- The `--surface-sunken` variable already exists in the design system
- This approach follows modern CMS patterns (Ghost, Linear, Vercel)
- Creates clear visual hierarchy without being heavy-handed
- Preserves the existing border and focus ring system
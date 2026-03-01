# OpenQase Component Library

## Overview
This document catalogs all UI components in the OpenQase design system. Components are organized by category and include usage guidelines.

## Design Foundation

### Themes
- **Light** - Default clean theme with warm cream backgrounds, yellow primary accents, and blue secondary accents
- **Dark** - Dark mode with deep backgrounds and consistent accent colors

### Base Components (`src/components/ui/`)

#### Layout & Structure
- **`Card`** - Base container with variants for different content types
  - Location: `src/components/ui/card.tsx`
  - Props: `fixedHeight`, `height`, `animated`, standard HTML div props
  - Usage: Foundation for most content containers

#### Form Controls
- **`Button`** - Primary action component with multiple variants
  - Location: `src/components/ui/button.tsx`
  - Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
  - Sizes: `default`, `sm`, `lg`, `icon`
  - Built on: Radix UI Slot

- **`Input`** - Text input field
  - Location: `src/components/ui/input.tsx`
  - Standard HTML input with consistent styling

- **`Label`** - Form field labels
  - Location: `src/components/ui/label.tsx`
  - Built on: Radix UI Label

- **`Textarea`** - Multi-line text input
  - Location: `src/components/ui/textarea.tsx`

- **`Checkbox`** - Boolean input control
  - Location: `src/components/ui/checkbox.tsx`
  - Built on: Radix UI Checkbox

- **`Switch`** - Toggle control
  - Location: `src/components/ui/switch.tsx`

- **`Select`** - Dropdown selection
  - Location: `src/components/ui/select.tsx`
  - Built on: Radix UI Select

#### Navigation & Interaction
- **`Dropdown Menu`** - Contextual action menus
  - Location: `src/components/ui/dropdown-menu.tsx`
  - Built on: Radix UI Dropdown Menu
  - Includes: Content, Item, Separator, Label, etc.

- **`Dialog`** - Modal dialogs and overlays
  - Location: `src/components/ui/dialog.tsx`
  - Built on: Radix UI Dialog

- **`Alert Dialog`** - Confirmation and destructive action dialogs
  - Location: `src/components/ui/alert-dialog.tsx`
  - Built on: Radix UI Alert Dialog

- **`Tabs`** - Tab navigation interface
  - Location: `src/components/ui/tabs.tsx`
  - Built on: Radix UI Tabs

- **`Tooltip`** - Contextual help text
  - Location: `src/components/ui/tooltip.tsx`
  - Built on: Radix UI Tooltip

- **`Popover`** - Floating content containers
  - Location: `src/components/ui/popover.tsx`
  - Built on: Radix UI Popover

#### Display & Feedback
- **`Alert`** - Status messages and notifications
  - Location: `src/components/ui/alert.tsx`
  - Variants: `default`, `destructive`

- **`Badge`** - Small status indicators and labels
  - Location: `src/components/ui/badge.tsx`
  - Variants: Multiple styling options

- **`Toast`** - Temporary notification messages
  - Location: `src/components/ui/toast.tsx`, `toaster.tsx`

- **`Table`** - Data table display
  - Location: `src/components/ui/table.tsx`
  - Includes: Header, Body, Row, Cell components

- **`Scroll Area`** - Custom scrollable regions
  - Location: `src/components/ui/scroll-area.tsx`
  - Built on: Radix UI Scroll Area

#### Specialized UI
- **`Heading`** - Semantic heading component
  - Location: `src/components/ui/heading.tsx`

- **`Steps`** - Multi-step process indicator
  - Location: `src/components/ui/steps.tsx`

- **`Command`** - Command palette/search interface
  - Location: `src/components/ui/command.tsx`

- **`Data Table`** - Enhanced table with sorting/filtering
  - Location: `src/components/ui/data-table.tsx`
  - Built on: TanStack Table

- **`Tag Input`** - Multi-value input with tags
  - Location: `src/components/ui/tag-input.tsx`

#### Content Display
- **`Content Card`** - Specialized card for content listings with grid/list variants
  - Location: `src/components/ui/content-card.tsx`
  - Variants: `grid` (default), `list`
  - Features: Badge display, truncation, hover effects, metadata display
  - Props: `variant`, `metadata` (year, companyCount, lastUpdated)
  - Usage: Grid view for visual browsing, list view for detailed scanning

- **`View Switcher`** - Toggle between grid and list view modes
  - Location: `src/components/ui/view-switcher.tsx`
  - Props: `value`, `onValueChange`, `className`
  - Icons: Grid3X3 (grid), List (list)
  - Built on: Radix UI Tabs with custom styling

- **`Content List`** - Generic searchable/sortable content listing with card grid
  - Location: `src/components/ui/content-list.tsx`
  - Props: `items`, `type`, `basePath`, `renderBadges`, `renderExtraFilters`, `sortOptions`
  - Features: Search filter, sort dropdown, responsive card grid, empty state
  - Used by: quantum-software, quantum-hardware, quantum-companies, partner-companies listing pages
  - **Note**: The older listing pages (case studies, algorithms, industries, personas) have bespoke custom layouts that predate this component. Migrating them to use `ContentList` would require extending it to support their page-specific features (entity-specific filters, relationship badges, custom card designs). Consider this if those pages are ever redesigned.

- **`Learning Path Layout`** - Layout for educational content
  - Location: `src/components/ui/learning-path-layout.tsx`

- **`Newsletter Signup`** - Email subscription component
  - Location: `src/components/ui/newsletter-signup.tsx`

#### Renderers
- **`References Renderer`** - Display content references
  - Location: `src/components/ui/ReferencesRenderer.tsx`

- **`Steps Renderer`** - Display process steps
  - Location: `src/components/ui/StepsRenderer.tsx`

### Application Components (`src/components/`)

#### Authentication
- **`Auth Form`** - Login/signup form
  - Location: `src/components/auth/AuthForm.tsx`

- **`Protected Route`** - Route protection wrapper
  - Location: `src/components/auth/ProtectedRoute.tsx`

#### Error Handling
- **`Error Boundary`** - Generic error boundary
  - Location: `src/components/ui/ErrorBoundary.tsx`

- **`Global Error Boundary`** - App-level error handling
  - Location: `src/components/error-boundary/GlobalErrorBoundary.tsx`

- **`Content Error Boundary`** - Content-specific error handling
  - Location: `src/components/error-boundary/ContentErrorBoundary.tsx`

- **`Auth Error Boundary`** - Authentication error handling
  - Location: `src/components/error-boundary/AuthErrorBoundary.tsx`

#### Content Management
- **`Base Content Form`** - Foundation for content editing
  - Location: `src/components/admin/BaseContentForm.tsx`

- **`Auto Save Tabs`** - Tabbed interface with auto-save
  - Location: `src/components/admin/AutoSaveTabs.tsx`

- **`Publish Button`** - Content publishing control
  - Location: `src/components/admin/PublishButton.tsx`

- **`Validation Modal`** - Content validation dialog
  - Location: `src/components/admin/ValidationModal.tsx`

- **`Content Completeness`** - Content quality indicator
  - Location: `src/components/admin/ContentCompleteness.tsx`

- **`Relationship Selector`** - Content relationship picker
  - Location: `src/components/admin/RelationshipSelector.tsx`

- **`Resource Links Editor`** - External link management
  - Location: `src/components/admin/ResourceLinksEditor.tsx`

#### Content Display
- **`Case Study List`** - Display case studies
  - Location: `src/components/CaseStudyList.tsx`

- **`Case Studies List`** - Alternative case study display
  - Location: `src/components/CaseStudiesList.tsx`

- **`Algorithm List`** - Display algorithms
  - Location: `src/components/AlgorithmList.tsx`

- **`Industry List`** - Display industries
  - Location: `src/components/IndustryList.tsx`

- **`Persona List`** - Display personas
  - Location: `src/components/PersonaList.tsx`

- **`Persona Manager`** - Persona management interface
  - Location: `src/components/PersonaManager.tsx`

#### Journey & Interactive
- **`Interactive Journey`** - Journey visualization
  - Location: `src/components/journey/InteractiveJourney.tsx`

- **`Path Diagram`** - Visual path representation
  - Location: `src/components/journey/PathDiagram.tsx`

#### Layout & Navigation
- **`Navigation`** - Main site navigation
  - Location: `src/components/Navigation.tsx`

- **`Footer`** - Site footer
  - Location: `src/components/Footer.tsx`

- **`Footer Wrapper`** - Footer container
  - Location: `src/components/FooterWrapper.tsx`

#### Theming & Interaction
- **`Theme Toggle`** - Theme switching control
  - Location: `src/components/ThemeToggle.tsx`

- **`Theme Switcher`** - Enhanced theme selection
  - Location: `src/components/ui/ThemeSwitcher.tsx`

- **`Providers`** - App context providers
  - Location: `src/components/Providers.tsx`

#### Miscellaneous
- **`Alpha Banner`** - Alpha version indicator
  - Location: `src/components/ui/AlphaBanner.tsx`

- **`Card Pixel Pattern`** - Decorative card background
  - Location: `src/components/CardPixelPattern.tsx`

- **`Auto Schema`** - Schema generation utility
  - Location: `src/components/AutoSchema.tsx`

- **`Content Card`** - Content display card (different from ui/content-card)
  - Location: `src/ContentCard.tsx`

- **`Feedback Button`** - User feedback collection
  - Location: `src/components/FeedbackButton.tsx`

- **`Get Involved Section`** - Community engagement
  - Location: `src/components/GetInvolvedSection.tsx`

- **`Privacy Contact Link`** - Privacy-related contact
  - Location: `src/components/PrivacyContactLink.tsx`

- **`Tally Modal`** - External form integration
  - Location: `src/components/TallyModal.tsx`

## Usage Guidelines

### When to Use What
- **Card**: Default container for any grouped content
- **Content Card**: Specifically for content listings with badges and descriptions
- **Button**: Any actionable element
- **Dialog**: Modal interactions, confirmations
- **Alert**: Status messages, warnings, errors
- **Badge**: Small status indicators, tags, categories

### Component Selection Priority
1. Use existing UI components first
2. Extend with variants before creating new components
3. Create new components only for truly unique functionality

### Performance Notes
- All Radix components are tree-shakeable
- Card hover effects use Framer Motion for smooth GPU-accelerated animations
- Theme switching uses CSS variables for performance

## Animation Guidelines
- Use `animated` prop on Card components for hover effects
- Keep animations subtle (2px movement max)
- All animations respect `prefers-reduced-motion`
- Duration: 200ms for micro-interactions

## Design System Evolution

### v0.5.0 Design System Updates
- ✅ **Professional Visual Hierarchy**: Implemented proper elevation system with shadows and borders
- ✅ **Accessibility-Focused Colors**: Improved contrast ratios (10:1+) with deep blue-black text
- ✅ **Warm Background Palette**: Moved from stark white to warm cream for better eye comfort
- ✅ **Strategic Color Usage**: Yellow reserved for primary CTAs, blue for secondary actions, gray for UI elements
- ✅ **Consistent Shadow System**: Three-tier shadow progression (sm, md, lg) for visual depth
- ✅ **Enhanced Card Components**: Proper elevation with white backgrounds and subtle shadows

### Component Improvements
- ✅ Enhanced Card component with optional animations and proper elevation
- ✅ Added ContentCard variant system with grid/list layouts and metadata display
- ✅ Created ViewSwitcher component for content view toggling with persistence
- ✅ Implemented comprehensive error boundary system for better reliability
- ✅ Extended view switcher across all content lists with appropriate metadata
- ✅ Professional admin interface with auto-save and validation features

### Performance & Bundle Optimization
- ✅ Reduced bundle size through strategic dependency management
- ✅ GPU-accelerated animations using CSS transforms
- ✅ Tree-shakeable component architecture
- ✅ Static generation for 145+ pages with zero runtime database queries
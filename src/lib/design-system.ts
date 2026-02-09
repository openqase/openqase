/**
 * OpenQase Design System
 * Single source of truth for all design tokens
 * 
 * Based on Stark's accessibility principles and Material Design's systematic approach
 */

export const designSystem = {
  // Elevation System - Core hierarchy levels
  elevation: {
    sunken: -1,    // Hero sections, page headers
    base: 0,       // Page background
    content: 1,    // Main content, sidebar cards
    raised: 2,     // Highlighted cards, interactive elements
    overlay: 3,    // Modals, dropdowns
  },
  
  // Surface colors for each elevation level
  surfaces: {
    light: {
      sunken: '0 0% 95%',      // #f2f2f2 - Darker than base
      base: '0 0% 98%',         // #fafafa - Page background
      content: '0 0% 100%',     // #ffffff - Main content
      raised: '0 0% 100%',      // #ffffff - Cards (use shadows)
      overlay: '0 0% 100%',     // #ffffff - Modals
    },
    dark: {
      sunken: '0 0% 7%',        // #121212 - Deeper than base
      base: '0 0% 10%',         // #1a1a1a - Page background
      content: '0 0% 13%',      // #212121 - Main content
      raised: '0 0% 16%',       // #292929 - Cards
      overlay: '0 0% 20%',      // #333333 - Modals
    },
  },
  
  // Color Tokens
  colors: {
    // Base colors
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    
    // Card colors
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',
    
    // Text hierarchy
    textPrimary: 'hsl(var(--text-primary))',
    textSecondary: 'hsl(var(--text-secondary))',
    textTertiary: 'hsl(var(--text-tertiary))',
    
    // Accent colors
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    
    // Semantic colors
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    
    // UI colors
    border: 'hsl(var(--border))',
  },
  
  // Shadow Tokens (Stark-inspired visible shadows)
  shadows: {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },
  
  // Spacing Tokens
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
    '3xl': '6rem',   // 96px
  },
  
  // Border Radius Tokens
  radius: {
    none: '0',
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
    full: '9999px',
  },
  
  // Typography Scale
  typography: {
    // Font families
    fontSans: 'var(--font-sans)',
    fontHeading: 'var(--font-heading)',
    
    // Font sizes
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    // Font weights
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Line heights
    lineHeights: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
};

/**
 * Component Style Presets
 * Consistent styles for common UI patterns
 */
export const componentStyles = {
  // Card styles
  card: {
    base: 'bg-card rounded-lg border border-border',
    elevated: {
      sm: 'shadow-sm hover:shadow-md',
      md: 'shadow-md hover:shadow-lg',
      lg: 'shadow-lg hover:shadow-xl',
    },
    interactive: 'transition-all duration-200 hover:border-primary',
  },
  
  // Button styles
  button: {
    base: 'font-medium rounded-md transition-all duration-200',
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-muted text-foreground hover:bg-muted/80',
    ghost: 'hover:bg-muted/50',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },
  
  // Link styles
  link: {
    default: 'text-muted-foreground hover:text-foreground transition-colors',
    primary: 'text-primary hover:opacity-80 transition-opacity',
    underline: 'underline-offset-4 hover:underline',
  },
  
  // Badge styles
  badge: {
    base: 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium',
    outline: 'border border-border text-muted-foreground',
    filled: 'bg-primary/10 text-primary',
  },
  
  // Section styles
  section: {
    base: 'py-24 px-6',
    container: 'max-w-7xl mx-auto',
    spacing: {
      sm: 'py-16 px-4',
      md: 'py-20 px-6',
      lg: 'py-24 px-6',
      xl: 'py-32 px-8',
    },
  },
  
  // Grid styles
  grid: {
    base: 'grid',
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  },
};

/**
 * Design System Rules
 * Principles to follow when building UI
 */
export const designRules = {
  // Visual Hierarchy
  hierarchy: {
    1: 'Use shadows to indicate elevation and importance',
    2: 'Primary content and sidebar cards get white backgrounds with shadows',
    3: 'Hero sections and page headers use muted backgrounds to recede',
    4: 'All cards should be elevated, not sunken below the page background',
  },
  
  // Color Usage
  colorUsage: {
    1: 'Yellow (primary) only for CTAs and key interactions',
    2: 'Text should be black or gray, not colored',
    3: 'Icons default to gray, not yellow',
    4: 'Numbers use bold weight for emphasis, not color',
  },
  
  // Accessibility
  accessibility: {
    1: 'Maintain minimum contrast ratio of 7:1 for body text',
    2: 'Use shadows AND borders for card definition',
    3: 'Provide clear focus states for all interactive elements',
    4: 'Ensure touch targets are at least 44x44px',
  },
  
  // Consistency
  consistency: {
    1: 'All cards must have borders AND shadows',
    2: 'All cards must have rounded corners (rounded-lg)',
    3: 'Use semantic color variables, never hard-coded values',
    4: 'Follow the spacing scale for all margins and padding',
  },
};

// NOTE: Use cn() from '@/lib/utils' instead of duplicating here.
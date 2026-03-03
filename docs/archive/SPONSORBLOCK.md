# Sponsor Section Implementation Plan

## Overview
Add a sponsor section to the homepage between "Open Source & Community Driven" and the footer to support site sustainability through paid sponsorships while maintaining the open-source ethos.

## Design Specifications

### Section Layout
- **Position**: Between "Open Source & Community Driven" section and footer
- **Grid**: 3-column layout matching existing card sections
- **Responsive**: Stack vertically on mobile (same breakpoints as existing cards)
- **Section Title**: "Supported By" or "Our Sponsors" 
- **Subtitle**: "Organizations advancing quantum computing adoption"

### Sponsor Card Design

#### Visual Style
- Dark background cards matching existing theme (#1a1a1a or similar)
- Subtle border: 1px solid rgba(255, 255, 255, 0.1)
- Padding: Consistent with existing cards (24px or 32px)
- Height: Slightly more compact than feature cards
- Hover effect: Subtle lift or glow, consistent with existing interactions

#### Card Content Structure
```
[Sponsor Logo]
[Sponsor Name]
[Tagline/Description - 1-2 lines]
[Visit Sponsor →]
```

#### Logo Treatment
- Monochrome by default (white/gray on dark background)
- Option for subtle brand color on hover
- Max height: 48-64px
- SVG preferred for crisp rendering

### Sponsorship Tiers

#### Tier 1: Primary Sponsor
- Slightly larger card or featured position (center)
- Full color logo option
- 2-3 line description
- "Primary Sponsor" badge

#### Tier 2: Supporting Sponsor  
- Standard card size
- Monochrome logo with color on hover
- 1-2 line description
- "Supporting Sponsor" badge

#### Tier 3: Community Sponsor
- Compact card size
- Logo only or logo + name
- "Community Sponsor" badge
- Link to sponsor page

### Implementation Approach

#### Data Structure
```typescript
interface Sponsor {
  id: string;
  name: string;
  tier: 'primary' | 'supporting' | 'community';
  logo: string; // URL or path to logo
  logoAlt: string;
  description?: string;
  url: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}
```

#### Component Structure
```
<SponsorSection>
  <SectionHeader />
  <SponsorGrid>
    <SponsorCard tier="primary" />
    <SponsorCard tier="supporting" />
    <SponsorCard tier="supporting" />
  </SponsorGrid>
</SponsorSection>
```

### Content Management

#### Storage Options
1. **Static JSON**: Simple sponsors.json file for easy updates
2. **Environment Variables**: For sponsor URLs and sensitive data
3. **CMS Integration**: Add sponsors table to existing Supabase setup (recommended)

#### CMS Schema (Recommended)
```sql
CREATE TABLE sponsors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('primary', 'supporting', 'community')),
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Styling Considerations

#### Color Palette
- Background: Match existing dark cards (#0a0a0a to #1a1a1a range)
- Text: Primary white, secondary gray (#888)
- Accent: Yellow (#FFEB3B) for hover states and CTAs
- Sponsor badges: Subtle gradient or metallic effect

#### Typography
- Sponsor name: Font-medium, text-lg
- Description: Text-sm, text-gray-400
- Badge: Text-xs, uppercase, tracking-wider

### User Experience

#### Transparency
- Clear "Sponsor" or "Partner" labeling
- Link to sponsorship information page
- Disclosure in footer about sponsored content

#### Performance
- Lazy load sponsor logos
- Optimize image sizes (WebP with fallbacks)
- Static generation with ISR for sponsor updates

### Monetization Strategy

#### Sponsorship Packages
1. **Primary**: $X/month - Featured placement, full color, extended description
2. **Supporting**: $Y/month - Standard placement, hover color, brief description  
3. **Community**: $Z/month - Logo placement, link to sponsor

#### Benefits to Sponsors
- Homepage visibility
- Logo on relevant case studies (if applicable)
- Social media mentions
- Newsletter mentions (if applicable)

### Implementation Phases

#### Phase 1: MVP
- Static sponsor data (3 sponsors max)
- Basic card component
- Manual updates via code

#### Phase 2: CMS Integration
- Supabase sponsors table
- Admin interface for managing sponsors
- Automated expiration handling

#### Phase 3: Enhanced Features
- Sponsor analytics/tracking
- A/B testing different layouts
- Sponsor-specific landing pages
- ROI reporting for sponsors

### Ethical Considerations
- No sponsors from competing quantum platforms
- Verify sponsor legitimacy and alignment with open-source values
- Clear separation between editorial and sponsored content
- Maintain editorial independence for case studies

### Technical Requirements
- Component should be tree-shakeable
- No impact on Core Web Vitals
- Accessible (ARIA labels, keyboard navigation)
- No tracking without consent

### Success Metrics
- Click-through rate to sponsor sites
- Sponsor retention rate
- User feedback on sponsor integration
- Revenue generation vs. user experience impact

## Next Steps
1. Get stakeholder approval on design
2. Create Figma mockups or code prototype
3. Implement MVP with static data
4. Test with community for feedback
5. Launch with initial sponsors
6. Iterate based on metrics

## Questions to Address
- Should sponsors appear on other pages?
- How to handle sponsor rotation if more than 3?
- Should we offer industry-exclusive sponsorships?
- Integration with existing partnership/collaboration mentions?
- Sponsor approval process and criteria?
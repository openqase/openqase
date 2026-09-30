import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ContentCard from './content-card';

describe('ContentCard', () => {
  describe('Grid Variant', () => {
    it('renders with responsive auto-sizing classes and full height structure', () => {
      const html = renderToStaticMarkup(
        <ContentCard
          variant="grid"
          title="Quantum Traffic Optimization"
          description="Using quantum annealers to optimize urban vehicle routing."
          badges={['Optimization', 'Transportation']}
          href="/case-study/traffic-flow"
        />
      );

      // Link has h-full so it fills the grid cell
      expect(html).toContain('class="group block h-full"');
      // Card has h-full min-h-[200px] flex-col
      expect(html).toContain('h-full min-h-[200px] flex-col');
      expect(html).toContain('Quantum Traffic Optimization');
      expect(html).toContain('Using quantum annealers to optimize urban vehicle routing.');
      expect(html).toContain('Optimization');
      expect(html).toContain('Transportation');
    });

    it('does not render an empty badge container when badges array is empty', () => {
      const html = renderToStaticMarkup(
        <ContentCard
          variant="grid"
          title="Case Study Without Badges"
          description="Description without any tags."
          badges={[]}
          href="/case-study/no-badges"
        />
      );

      expect(html).toContain('Case Study Without Badges');
      expect(html).not.toContain('flex flex-wrap gap-2 mt-4 pt-2');
    });

    it('shows +N more badge when more than 3 badges are provided', () => {
      const html = renderToStaticMarkup(
        <ContentCard
          variant="grid"
          title="Multi-tag Study"
          description="A study with many tags."
          badges={['Finance', 'Optimization', 'VQE', 'Algorithms', 'Hardware']}
          href="/case-study/multi-tag"
        />
      );

      expect(html).toContain('+2 more');
    });

    it('applies custom className to the Card', () => {
      const html = renderToStaticMarkup(
        <ContentCard
          variant="grid"
          title="Custom Class Study"
          description="A study with custom class."
          badges={['Finance']}
          href="/case-study/custom-class"
          className="custom-extra-class"
        />
      );

      expect(html).toContain('custom-extra-class');
    });
  });

  describe('List Variant', () => {
    it('renders with horizontal list layout and metadata when provided', () => {
      const html = renderToStaticMarkup(
        <ContentCard
          variant="list"
          title="List View Study"
          description="List view description."
          badges={['Chemistry']}
          href="/case-study/list-view"
          metadata={{
            year: 2024,
            companyCount: 3,
          }}
        />
      );

      expect(html).toContain('h-auto flex-row gap-6');
      expect(html).toContain('2024');
      expect(html).toContain('3 companies');
      expect(html).toContain('Chemistry');
    });
  });
});

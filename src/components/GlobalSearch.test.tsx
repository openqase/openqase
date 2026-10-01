import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalSearch from './GlobalSearch';
import type { SearchableItem } from '@/lib/content-fetchers';

const mockSearchData: SearchableItem[] = [
  {
    id: 'cs-1',
    title: 'Financial Portfolio Optimization with Quantum Annealing',
    slug: 'portfolio-optimization',
    type: 'case_studies',
    description: 'A study on optimizing investment portfolios using D-Wave systems.',
    metadata: {
      companies: ['Goldman Sachs', 'D-Wave'],
      year: 2024,
    },
  },
  {
    id: 'alg-1',
    title: 'Quantum Approximate Optimization Algorithm (QAOA)',
    slug: 'qaoa',
    type: 'algorithms',
    description: 'A hybrid quantum-classical algorithm for combinatorial problems.',
    metadata: {
      quantum_advantage: 'Polynomial speedup',
      use_cases: ['Portfolio optimization', 'Routing'],
    },
  },
];

describe('GlobalSearch', () => {
  it('renders search input with placeholder and accessibility attributes', () => {
    const html = renderToStaticMarkup(
      <GlobalSearch searchData={mockSearchData} />
    );

    expect(html).toContain('placeholder="Search case studies, algorithms, companies..."');
    expect(html).toContain('aria-label="Search case studies, algorithms, and companies"');
  });

  it('renders with custom className when provided', () => {
    const html = renderToStaticMarkup(
      <GlobalSearch searchData={mockSearchData} className="custom-search-class" />
    );

    expect(html).toContain('custom-search-class');
  });
});

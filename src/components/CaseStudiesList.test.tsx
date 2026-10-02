import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaseStudiesList } from './CaseStudiesList';
import type { Database } from '@/types/supabase';

type CaseStudy = Database['public']['Tables']['case_studies']['Row'];

describe('CaseStudiesList', () => {
  it('renders initial fallback when case studies list is empty', () => {
    const html = renderToStaticMarkup(
      <CaseStudiesList caseStudies={[]} />
    );

    expect(html).toContain('No case studies found.');
  });

  it('renders search input and sort controls for case studies', () => {
    const mockCaseStudies = [
      {
        id: '1',
        title: 'Quantum Risk Analysis',
        slug: 'quantum-risk-analysis',
        description: 'Analyzing financial risk with quantum Monte Carlo methods.',
        year: 2023,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        published: true,
        featured: false,
      },
    ] as unknown as CaseStudy[];

    const html = renderToStaticMarkup(
      <CaseStudiesList caseStudies={mockCaseStudies} />
    );

    expect(html).toContain('Search case studies');
    expect(html).toContain('placeholder="Search by title, description, or year..."');
    expect(html).toContain('Quantum Risk Analysis');
    expect(html).toContain('1 case study found');
  });

  it('initial render exposes aria-busy and a live count with no skeleton markup', () => {
    const mockCaseStudies = [
      {
        id: '1',
        title: 'Quantum Risk Analysis',
        slug: 'quantum-risk-analysis',
        description: 'Analyzing financial risk with quantum Monte Carlo methods.',
        year: 2023,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        published: true,
        featured: false,
      },
    ] as unknown as CaseStudy[];

    const html = renderToStaticMarkup(
      <CaseStudiesList caseStudies={mockCaseStudies} />
    );

    expect(html).toContain('aria-busy="false"');
    expect(html).not.toContain('animate-pulse');
    expect(html).toContain('1 case study found');
    expect(html).not.toContain('Searching case studies');
  });
});

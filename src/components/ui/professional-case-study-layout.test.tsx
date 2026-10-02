import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfessionalCaseStudyLayout, { formatResourceLink } from './professional-case-study-layout';
import ProfessionalAlgorithmDetailLayout from './professional-algorithm-detail-layout';
import ProfessionalIndustryDetailLayout from './professional-industry-detail-layout';
import ProfessionalPersonaDetailLayout from './professional-persona-detail-layout';

describe('formatResourceLink', () => {
  it('prefers human-readable title when provided', () => {
    const text = formatResourceLink({
      url: 'https://www.nature.com/articles/d41573-022-00001-9',
      label: 'nature.com',
      title: 'Quantum Computing in Drug Discovery and Development',
    });
    expect(text).toBe('Quantum Computing in Drug Discovery and Development');
  });

  it('uses human-readable label when title is absent', () => {
    const text = formatResourceLink({
      url: 'https://arxiv.org/abs/2001.01120',
      label: 'Quantum Chemistry Simulations of Dominant Products',
    });
    expect(text).toBe('Quantum Chemistry Simulations of Dominant Products');
  });

  it('formats raw URL into domain and filename when title and label are absent', () => {
    const text = formatResourceLink({
      url: 'https://www.cigref.fr/wp/wp-content/uploads/2020/04/Cigref-Quantum-Report.pdf',
    });
    expect(text).toBe('cigref.fr — Cigref-Quantum-Report.pdf');
  });

  it('formats URL with domain-only path when no sub-path is present', () => {
    const text = formatResourceLink({
      url: 'https://www.qrypt.com/',
    });
    expect(text).toBe('qrypt.com');
  });

  it('falls back to title over a label that is a raw URL', () => {
    const text = formatResourceLink({
      url: 'https://www.qrypt.com/resources/',
      label: 'https://www.qrypt.com/resources/',
      title: 'Qrypt Resources - Quantum Security Solutions',
    });
    expect(text).toBe('Qrypt Resources - Quantum Security Solutions');
  });

  it('ignores a whitespace-only title and falls through to the label', () => {
    expect(formatResourceLink({ url: 'https://example.com/x', title: '   ', label: 'Example' })).toBe('Example');
  });

  it('treats an upper-case scheme as a raw URL, not a title', () => {
    expect(formatResourceLink({ url: 'https://example.com/report.pdf', title: 'HTTPS://example.com/report.pdf' })).toBe('example.com — report.pdf');
  });

  it('does not throw when title or label is not a string', () => {
    const link = { url: 'https://example.com/report.pdf', title: 42, label: { bad: true } } as unknown as Parameters<typeof formatResourceLink>[0];
    expect(formatResourceLink(link)).toBe('example.com — report.pdf');
  });

  it('returns a placeholder when url is missing', () => {
    expect(formatResourceLink({} as Parameters<typeof formatResourceLink>[0])).toBe('Resource Link');
  });

  it('keeps the raw URL when the last path segment has a malformed percent-escape', () => {
    expect(formatResourceLink({ url: 'https://example.com/%E0%A4%A' })).toBe('https://example.com/%E0%A4%A');
  });
});

describe('Professional Layout Sidebars', () => {
  describe('ProfessionalCaseStudyLayout', () => {
    it('always renders Quick Facts, Technical Details, and Categories cards even when relations are empty', () => {
      const html = renderToStaticMarkup(
        <ProfessionalCaseStudyLayout
          title="Sample Study"
          caseStudy={{
            year: undefined,
            partner_companies: [],
            quantum_companies: [],
            quantum_hardware: [],
            quantum_software: [],
            industries: [],
            algorithms: [],
            personas: [],
          }}
        >
          <p>Article body</p>
        </ProfessionalCaseStudyLayout>
      );

      // Sidebar section headers
      expect(html).toContain('Quick Facts');
      expect(html).toContain('Technical Details');
      expect(html).toContain('Categories');

      // Fallbacks
      expect(html).toContain('Year');
      expect(html).toContain('Not specified');
      expect(html).toContain('Partner Companies');
      expect(html).toContain('None specified');
      expect(html).toContain('Quantum Companies');
      expect(html).toContain('Quantum Hardware');
      expect(html).toContain('Quantum Software');
      expect(html).toContain('No information available');
    });

    it('renders entity badges when relations are populated', () => {
      const html = renderToStaticMarkup(
        <ProfessionalCaseStudyLayout
          title="Sample Study"
          caseStudy={{
            year: 2025,
            partner_companies: [{ id: 'p1', name: 'Partner One', slug: 'partner-one' }],
            quantum_companies: [{ id: 'q1', name: 'Quantum Co', slug: null }],
            quantum_hardware: [{ id: 'h1', name: 'IBM Quantum', slug: 'ibm-quantum' }],
            quantum_software: [{ id: 's1', name: 'Qiskit', slug: 'qiskit' }],
            industries: [{ id: 'i1', name: 'Finance', slug: 'finance' }],
          }}
        >
          <p>Article body</p>
        </ProfessionalCaseStudyLayout>
      );

      expect(html).toContain('2025');
      expect(html).toContain('Partner One');
      expect(html).toContain('/paths/partner-companies/partner-one');
      expect(html).toContain('Quantum Co');
      expect(html).toContain('IBM Quantum');
      expect(html).toContain('/paths/quantum-hardware/ibm-quantum');
      expect(html).toContain('Qiskit');
      expect(html).toContain('/paths/quantum-software/qiskit');
      expect(html).toContain('Finance');
    });

    it('renders Additional Resources with formatted descriptive text and title attributes', () => {
      const html = renderToStaticMarkup(
        <ProfessionalCaseStudyLayout
          title="Sample Study"
          caseStudy={{
            resource_links: [
              {
                url: 'https://www.qrypt.com/resources/',
                label: 'https://www.qrypt.com/resources/',
                title: 'Qrypt Resources - Quantum Security Solutions',
                order: 1,
              },
              {
                url: 'https://www.cigref.fr/wp/wp-content/uploads/2020/04/Cigref-Quantum-computing-Report.pdf',
                order: 2,
              },
            ],
          }}
        >
          <p>Article body</p>
        </ProfessionalCaseStudyLayout>
      );

      expect(html).toContain('Additional Resources');
      // Uses descriptive title over raw URL label
      expect(html).toContain('Qrypt Resources - Quantum Security Solutions');
      // Cleans raw URL into domain — filename
      expect(html).toContain('cigref.fr — Cigref-Quantum-computing-Report.pdf');
      // Includes title attribute with full destination URL
      expect(html).toContain('title="https://www.qrypt.com/resources/"');
      expect(html).toContain('title="https://www.cigref.fr/wp/wp-content/uploads/2020/04/Cigref-Quantum-computing-Report.pdf"');
    });

    it('skips null resource_links entries, sorts by order, and does not mutate the prop', () => {
      const links = [
        null,
        { url: 'https://example.com/a.pdf', order: 2 },
        { url: 'https://example.com/b.pdf', order: 1 },
      ];
      const html = renderToStaticMarkup(
        <ProfessionalCaseStudyLayout
          title="Sample Study"
          caseStudy={{ resource_links: links }}
        >
          <p>Article body</p>
        </ProfessionalCaseStudyLayout>
      );

      expect(html.indexOf('b.pdf')).toBeGreaterThan(-1);
      expect(html.indexOf('b.pdf')).toBeLessThan(html.indexOf('a.pdf'));
      expect(links[0]).toBeNull();
      expect((links[1] as { url: string }).url).toBe('https://example.com/a.pdf');
      expect((links[2] as { url: string }).url).toBe('https://example.com/b.pdf');
    });
  });

  describe('ProfessionalAlgorithmDetailLayout', () => {
    it('renders Applications with fallback when use_cases is empty', () => {
      const html = renderToStaticMarkup(
        <ProfessionalAlgorithmDetailLayout
          title="VQE"
          algorithm={{
            use_cases: [],
          }}
        >
          <p>Body</p>
        </ProfessionalAlgorithmDetailLayout>
      );

      expect(html).toContain('Algorithm Details');
      expect(html).toContain('Applications');
      expect(html).toContain('None specified');
    });

    it('renders use case badges when present', () => {
      const html = renderToStaticMarkup(
        <ProfessionalAlgorithmDetailLayout
          title="VQE"
          algorithm={{
            use_cases: ['Chemistry Simulation', 'Optimization'],
          }}
        >
          <p>Body</p>
        </ProfessionalAlgorithmDetailLayout>
      );

      expect(html).toContain('Chemistry Simulation');
      expect(html).toContain('Optimization');
    });
  });

  describe('ProfessionalIndustryDetailLayout', () => {
    it('renders Industry Details with fallback message', () => {
      const html = renderToStaticMarkup(
        <ProfessionalIndustryDetailLayout
          title="Healthcare"
          industry={{}}
        >
          <p>Body</p>
        </ProfessionalIndustryDetailLayout>
      );

      expect(html).toContain('Industry Details');
      expect(html).toContain('No additional details available');
    });
  });

  describe('ProfessionalPersonaDetailLayout', () => {
    it('renders Professional Profile with fallback when expertise is empty', () => {
      const html = renderToStaticMarkup(
        <ProfessionalPersonaDetailLayout
          title="Researcher"
          persona={{
            expertise: [],
          }}
        >
          <p>Body</p>
        </ProfessionalPersonaDetailLayout>
      );

      expect(html).toContain('Professional Profile');
      expect(html).toContain('Core Expertise');
      expect(html).toContain('None specified');
    });

    it('renders expertise badges when present', () => {
      const html = renderToStaticMarkup(
        <ProfessionalPersonaDetailLayout
          title="Researcher"
          persona={{
            expertise: ['Quantum Computing', 'Linear Algebra'],
          }}
        >
          <p>Body</p>
        </ProfessionalPersonaDetailLayout>
      );

      expect(html).toContain('Quantum Computing');
      expect(html).toContain('Linear Algebra');
    });
  });
});

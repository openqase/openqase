import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfessionalCaseStudyLayout from './professional-case-study-layout';
import ProfessionalAlgorithmDetailLayout from './professional-algorithm-detail-layout';
import ProfessionalIndustryDetailLayout from './professional-industry-detail-layout';
import ProfessionalPersonaDetailLayout from './professional-persona-detail-layout';

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

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LearningPathsPage from './page';

describe('LearningPathsPage (/paths)', () => {
  it('renders all 8 cards in a balanced 4-column responsive grid', async () => {
    const pageComponent = await LearningPathsPage();
    const html = renderToStaticMarkup(pageComponent);

    // Grid layout class check
    expect(html).toContain('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');

    // All 8 cards check
    const expectedCards = [
      { title: 'By Persona', href: '/paths/persona' },
      { title: 'By Industry', href: '/paths/industry' },
      { title: 'By Algorithm', href: '/paths/algorithm' },
      { title: 'Quantum Software', href: '/paths/quantum-software' },
      { title: 'Quantum Hardware', href: '/paths/quantum-hardware' },
      { title: 'Quantum Companies', href: '/paths/quantum-companies' },
      { title: 'Partner Companies', href: '/paths/partner-companies' },
      { title: 'All Case Studies', href: '/case-study' },
    ];

    for (const card of expectedCards) {
      expect(html).toContain(card.title);
      expect(html).toContain(`href="${card.href}"`);
    }
  });
});

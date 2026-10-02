import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchEmptyState } from './search-empty-state';

describe('SearchEmptyState', () => {
  it('renders default empty state message when no query or filters are given', () => {
    const html = renderToStaticMarkup(
      <SearchEmptyState resourceName="case studies" />
    );

    expect(html).toContain('No case studies found');
    expect(html).toContain('Try adjusting your search criteria');
  });

  it('renders query-specific title and suggestions', () => {
    const html = renderToStaticMarkup(
      <SearchEmptyState
        query="superposition"
        resourceName="algorithms"
        suggestions={['Grover', 'QAOA']}
      />
    );

    expect(html).toContain('No algorithms found matching &quot;superposition&quot;');
    expect(html).toContain('Grover');
    expect(html).toContain('QAOA');
    expect(html).toContain('Suggestions:');
  });

  it('renders filter-specific title and reset button when hasFilters is true', () => {
    const onClearAll = vi.fn();
    const html = renderToStaticMarkup(
      <SearchEmptyState
        hasFilters={true}
        resourceName="industries"
        onClearAll={onClearAll}
      />
    );

    expect(html).toContain('No industries found matching your filters');
    expect(html).toContain('Reset filters');
  });

  it('renders combined search and filters reset button when both query and filters exist', () => {
    const onClearSearch = vi.fn();
    const onClearAll = vi.fn();
    const html = renderToStaticMarkup(
      <SearchEmptyState
        query="finance"
        hasFilters={true}
        resourceName="case studies"
        onClearSearch={onClearSearch}
        onClearAll={onClearAll}
      />
    );

    expect(html).toContain('No case studies found matching &quot;finance&quot; with current filters');
    expect(html).toContain('Reset all filters &amp; search');
    expect(html).toContain('Clear search');
  });

  it('is not a second live region (the result counter already announces changes)', () => {
    const html = renderToStaticMarkup(<SearchEmptyState query="x" resourceName="items" />);

    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('aria-live');
  });
});

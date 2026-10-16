// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot, type Root } from 'react-dom/client';
import { act, type AnchorHTMLAttributes, type MouseEvent as ReactMouseEvent } from 'react';
import GlobalSearch from './GlobalSearch';
import type { SearchableItem } from '@/lib/content-fetchers';

// next/link needs the App Router at runtime. Stand in a plain anchor that
// behaves like Link on click: run the caller's onClick, then client-navigate.
const navigate = vi.hoisted(() => vi.fn());
vi.mock('next/link', () => ({
  default: ({ href, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a
      href={href}
      {...rest}
      onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  ),
}));

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
  {
    id: 'ind-1',
    title: 'Finance',
    slug: 'finance',
    type: 'industries',
    description: 'Portfolio optimization and risk analysis.',
    metadata: {},
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

describe('GlobalSearch keyboard combobox', () => {
  let container: HTMLDivElement;
  let root: Root;
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    navigate.mockReset();
    scrollIntoView.mockReset();
    // jsdom does not implement scrollIntoView.
    Element.prototype.scrollIntoView = scrollIntoView;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(<GlobalSearch searchData={mockSearchData} />);
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const input = () => container.querySelector('input') as HTMLInputElement;
  const listbox = () => container.querySelector('[role="listbox"]');
  const options = () => Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));

  function type(value: string) {
    act(() => {
      // Set the value through the native setter so React sees the change.
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input(), value);
      input().dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Let the 300ms debounce settle.
    act(() => {
      vi.advanceTimersByTime(300);
    });
  }

  function press(key: string) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => {
      input().dispatchEvent(event);
    });
    return event;
  }

  it('exposes the input as a collapsed list combobox before searching', () => {
    expect(input().getAttribute('role')).toBe('combobox');
    expect(input().getAttribute('aria-autocomplete')).toBe('list');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().getAttribute('aria-controls')).toBeTruthy();
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('renders results as a listbox of options controlled by the input', () => {
    type('optimization');

    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(listbox()).not.toBeNull();
    expect(listbox()!.id).toBe(input().getAttribute('aria-controls'));

    const opts = options();
    expect(opts.map((o) => o.textContent)).toEqual([
      expect.stringContaining('Financial Portfolio Optimization'),
      expect.stringContaining('Quantum Approximate Optimization'),
      expect.stringContaining('Finance'),
    ]);
    for (const option of opts) {
      expect(option.id).toBeTruthy();
      expect(option.getAttribute('aria-selected')).toBe('false');
      // Focus stays on the input; options are reached with the arrow keys.
      expect(option.tabIndex).toBe(-1);
    }
    expect(new Set(opts.map((o) => o.id)).size).toBe(opts.length);
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('ArrowDown moves the active option, highlights it and scrolls it into view', () => {
    type('optimization');
    const ids = options().map((o) => o.id);

    const event = press('ArrowDown');
    expect(event.defaultPrevented).toBe(true);
    expect(input().getAttribute('aria-activedescendant')).toBe(ids[0]);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    expect(options()[0].className).toContain('bg-muted');
    expect(options()[1].getAttribute('aria-selected')).toBe('false');
    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(options()[0]);

    press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe(ids[1]);
    expect(options()[0].getAttribute('aria-selected')).toBe('false');
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(options()[1]);

    // Option ids are stable across re-renders.
    expect(options().map((o) => o.id)).toEqual(ids);
  });

  it('wraps from the last option to the first and back', () => {
    type('optimization');
    const ids = options().map((o) => o.id);

    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe(ids[2]);

    press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe(ids[0]);

    press('ArrowUp');
    expect(input().getAttribute('aria-activedescendant')).toBe(ids[2]);
  });

  it('ArrowUp with no active option starts from the last option', () => {
    type('optimization');
    const ids = options().map((o) => o.id);

    const event = press('ArrowUp');
    expect(event.defaultPrevented).toBe(true);
    expect(input().getAttribute('aria-activedescendant')).toBe(ids[2]);
  });

  it('Enter opens the active result the same way a click does', () => {
    type('optimization');
    press('ArrowDown');
    press('ArrowDown');

    const event = press('Enter');
    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/paths/algorithm/qaoa');
    // Selecting a result closes the dropdown, as a click does.
    expect(listbox()).toBeNull();
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('Enter does nothing when no option is active', () => {
    type('optimization');

    press('Enter');
    expect(navigate).not.toHaveBeenCalled();
    expect(listbox()).not.toBeNull();
  });

  it('typing again clears the active option', () => {
    type('optimization');
    press('ArrowDown');
    expect(input().hasAttribute('aria-activedescendant')).toBe(true);

    type('portfolio');
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
    expect(options().every((o) => o.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('Escape closes the results, clears the active option and keeps focus on the input', () => {
    act(() => input().focus());
    type('optimization');
    press('ArrowDown');

    press('Escape');
    expect(document.activeElement).toBe(input());
    expect(listbox()).toBeNull();
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
    // The query is kept, as before.
    expect(input().value).toBe('optimization');
  });

  it('ArrowDown reopens closed results and activates the first option', () => {
    type('optimization');
    press('Escape');
    expect(listbox()).toBeNull();

    press('ArrowDown');
    expect(listbox()).not.toBeNull();
    expect(input().getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('arrow keys do nothing while results are still loading', () => {
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input(), 'optimization');
      input().dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Debounce has not fired yet: the loading status is showing.
    expect(listbox()).toBeNull();

    press('ArrowDown');
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('clicking a result still navigates and closes the dropdown', () => {
    type('optimization');

    act(() => {
      options()[2].click();
    });
    expect(navigate).toHaveBeenCalledWith('/paths/industry/finance');
    expect(listbox()).toBeNull();
  });
});

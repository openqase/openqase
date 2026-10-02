import { useDeferredValue, useState } from 'react';

/**
 * Search input state for in-memory filtered lists.
 *
 * The input is controlled by `query` so keystrokes are never delayed. Filtering
 * should read `deferredQuery`: React keeps rendering the previous results while
 * it computes the new ones, so the list never unmounts or flashes a skeleton.
 * `isPending` is true only during that (usually sub-frame) gap and is meant for
 * `aria-busy` and a subtle visual cue, not for replacing content.
 */
export function useSearchQuery(initial = '') {
  const [query, setQuery] = useState(initial);
  const deferredQuery = useDeferredValue(query);
  const isPending = query !== deferredQuery;
  return { query, deferredQuery, isPending, setQuery };
}

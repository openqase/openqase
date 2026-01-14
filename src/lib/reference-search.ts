/**
 * Academic Reference Search Utilities
 *
 * Provides functions for searching and formatting academic references from:
 * - YAML curated algorithm papers (instant, reliable)
 * - arXiv API (live search, 2-5 seconds)
 * - Semantic Scholar API (live search, 1-3 seconds)
 */

import { XMLParser } from 'fast-xml-parser';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

export interface YAMLReference {
  title: string;
  authors: string;
  year: number;
  arxiv?: string;
  doi?: string;
  url: string;
  note?: string;
  isbn?: string;
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string;
  published: string;
  summary: string;
  arxivId: string;
  url: string;
}

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: { name: string }[];
  year: number | null;
  abstract: string | null;
  url: string;
  citationCount: number;
  publicationVenue?: string;
}

export interface FormattedReference {
  source: 'yaml' | 'arxiv' | 'semantic-scholar';
  text: string; // Formatted for markdown citation
  title: string; // For display in modal
  authors: string;
  year: number | string;
  url: string;
}

// ============================================================================
// YAML Reference Loader
// ============================================================================

let yamlCache: Record<string, { name: string; references: YAMLReference[] }> | null = null;

/**
 * Load and parse algorithm-academic-references.yaml
 * Caches result in memory for performance
 */
export async function loadYAMLReferences(): Promise<Record<string, { name: string; references: YAMLReference[] }>> {
  if (yamlCache) {
    return yamlCache;
  }

  try {
    const yamlPath = path.join(process.cwd(), 'algorithm-academic-references.yaml');
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const data = yaml.load(fileContents) as Record<string, { name: string; references: YAMLReference[] }>;

    yamlCache = data;
    return data;
  } catch (error) {
    console.error('[loadYAMLReferences] Error loading YAML:', error);
    return {};
  }
}

/**
 * Get references for a specific algorithm by slug
 */
export function getAlgorithmReferences(
  algorithmSlug: string,
  yamlData: Record<string, { name: string; references: YAMLReference[] }>
): YAMLReference[] {
  const algorithmData = yamlData[algorithmSlug];
  if (!algorithmData || !algorithmData.references) {
    return [];
  }
  return algorithmData.references;
}

// ============================================================================
// arXiv API Integration
// ============================================================================

/**
 * Search arXiv for papers matching the query
 * API: http://export.arxiv.org/api/query
 * Rate limit: ~1 request per 3 seconds
 */
export async function searchArxiv(query: string, maxResults: number = 5): Promise<ArxivPaper[]> {
  try {
    // Construct query - search in title and abstract
    const searchQuery = `search_query=all:"${encodeURIComponent(query)}"&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
    const url = `http://export.arxiv.org/api/query?${searchQuery}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenQASE/1.0 (Academic Reference Search)'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`arXiv API returned ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse XML using fast-xml-parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    const result = parser.parse(xmlText);

    // arXiv returns Atom feed format
    const feed = result.feed;
    if (!feed || !feed.entry) {
      return [];
    }

    // Handle single entry (not array) or multiple entries (array)
    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

    return entries.map((entry: any) => {
      // Extract arXiv ID from entry id (format: http://arxiv.org/abs/1234.5678v1)
      const arxivIdMatch = entry.id?.match(/arxiv\.org\/abs\/([0-9.]+)/);
      const arxivId = arxivIdMatch ? arxivIdMatch[1] : '';

      // Parse authors (can be single object or array)
      let authors = 'Unknown';
      if (entry.author) {
        const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
        const authorNames = authorList.map((a: any) => a.name).filter(Boolean);

        if (authorNames.length === 0) {
          authors = 'Unknown';
        } else if (authorNames.length === 1) {
          authors = authorNames[0];
        } else if (authorNames.length === 2) {
          authors = `${authorNames[0]}, ${authorNames[1]}`;
        } else {
          authors = `${authorNames[0]} et al.`;
        }
      }

      // Parse publication date
      const published = entry.published || '';
      const year = published.split('-')[0] || '';

      return {
        id: entry.id || '',
        title: entry.title?.replace(/\s+/g, ' ').trim() || 'Untitled',
        authors,
        published: year,
        summary: entry.summary?.replace(/\s+/g, ' ').trim() || '',
        arxivId,
        url: `https://arxiv.org/abs/${arxivId}`
      };
    }).filter((paper: ArxivPaper) => paper.arxivId); // Filter out malformed entries
  } catch (error) {
    console.error('[searchArxiv] Error:', error);
    throw new Error(`arXiv search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Semantic Scholar API Integration
// ============================================================================

/**
 * Search Semantic Scholar for papers matching the query
 * API: https://api.semanticscholar.org/graph/v1/paper/search
 * Rate limit: 100 requests per 5 minutes
 */
export async function searchSemanticScholar(query: string, limit: number = 5): Promise<SemanticScholarPaper[]> {
  try {
    const fields = 'title,authors,year,abstract,url,citationCount,publicationVenue';
    const searchQuery = encodeURIComponent(query);
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${searchQuery}&limit=${limit}&fields=${fields}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenQASE/1.0 (Academic Reference Search)'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Semantic Scholar API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data
      .map((paper: any) => ({
        paperId: paper.paperId || '',
        title: paper.title || 'Untitled',
        authors: paper.authors || [],
        year: paper.year,
        abstract: paper.abstract,
        url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        citationCount: paper.citationCount || 0,
        publicationVenue: paper.publicationVenue?.name
      }))
      .sort((a: SemanticScholarPaper, b: SemanticScholarPaper) => b.citationCount - a.citationCount); // Sort by citations descending
  } catch (error) {
    console.error('[searchSemanticScholar] Error:', error);
    throw new Error(`Semantic Scholar search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Reference Formatting
// ============================================================================

/**
 * Format a YAML reference for display and insertion
 */
function formatYAMLReference(ref: YAMLReference): FormattedReference {
  const parts: string[] = [];

  // Authors and title
  parts.push(`${ref.authors} (${ref.year}). "${ref.title}".`);

  // arXiv ID
  if (ref.arxiv) {
    parts.push(`arXiv:${ref.arxiv}.`);
  }

  // DOI
  if (ref.doi) {
    parts.push(`DOI: ${ref.doi}.`);
  }

  // ISBN (for books)
  if (ref.isbn) {
    parts.push(`ISBN: ${ref.isbn}.`);
  }

  // URL
  if (ref.url) {
    parts.push(`Available at: ${ref.url}`);
  }

  // Note (if any)
  if (ref.note) {
    parts.push(`(${ref.note})`);
  }

  const text = parts.join(' ');

  return {
    source: 'yaml',
    text,
    title: ref.title,
    authors: ref.authors,
    year: ref.year,
    url: ref.url
  };
}

/**
 * Format an arXiv paper for display and insertion
 */
function formatArxivReference(paper: ArxivPaper): FormattedReference {
  const text = `${paper.authors} (${paper.published}). "${paper.title}". arXiv:${paper.arxivId}. Available at: ${paper.url}`;

  return {
    source: 'arxiv',
    text,
    title: paper.title,
    authors: paper.authors,
    year: paper.published,
    url: paper.url
  };
}

/**
 * Format a Semantic Scholar paper for display and insertion
 */
function formatSemanticScholarReference(paper: SemanticScholarPaper): FormattedReference {
  // Format authors
  let authors = 'Unknown';
  if (paper.authors && paper.authors.length > 0) {
    const authorNames = paper.authors.map(a => a.name).filter(Boolean);

    if (authorNames.length === 1) {
      authors = authorNames[0];
    } else if (authorNames.length === 2) {
      authors = `${authorNames[0]}, ${authorNames[1]}`;
    } else if (authorNames.length > 2) {
      authors = `${authorNames[0]} et al.`;
    }
  }

  const year = paper.year || 'n.d.';
  const parts: string[] = [];

  parts.push(`${authors} (${year}). "${paper.title}".`);

  // Add venue if available
  if (paper.publicationVenue) {
    parts.push(`${paper.publicationVenue}.`);
  }

  // Add citation count
  if (paper.citationCount > 0) {
    parts.push(`Citations: ${paper.citationCount}.`);
  }

  parts.push(`Available at: ${paper.url}`);

  const text = parts.join(' ');

  return {
    source: 'semantic-scholar',
    text,
    title: paper.title,
    authors,
    year: year.toString(),
    url: paper.url
  };
}

/**
 * Format a reference based on its source type
 */
export function formatReference(
  ref: YAMLReference | ArxivPaper | SemanticScholarPaper,
  source: 'yaml' | 'arxiv' | 'semantic-scholar'
): FormattedReference {
  switch (source) {
    case 'yaml':
      return formatYAMLReference(ref as YAMLReference);
    case 'arxiv':
      return formatArxivReference(ref as ArxivPaper);
    case 'semantic-scholar':
      return formatSemanticScholarReference(ref as SemanticScholarPaper);
    default:
      throw new Error(`Unknown reference source: ${source}`);
  }
}

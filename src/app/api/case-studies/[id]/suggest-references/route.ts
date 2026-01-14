/**
 * API Route: Suggest Academic References
 *
 * Fetches academic reference suggestions for a case study by:
 * 1. Looking up curated references from YAML (instant)
 * 2. Searching arXiv API (2-5 seconds)
 * 3. Searching Semantic Scholar API (1-3 seconds)
 *
 * Returns structured suggestions grouped by source for admin review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase';
import {
  loadYAMLReferences,
  getAlgorithmReferences,
  searchArxiv,
  searchSemanticScholar,
  formatReference,
  type FormattedReference
} from '@/lib/reference-search';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;

    // 1. Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Case study ID is required' },
        { status: 400 }
      );
    }

    console.log(`[SuggestReferences] Fetching references for case study: ${id}`);

    // 2. Fetch case study with algorithms
    const supabase = await createServiceRoleSupabaseClient();
    const { data: caseStudy, error: csError } = await supabase
      .from('case_studies')
      .select(`
        id,
        title,
        algorithm_case_study_relations!inner(
          algorithms!inner(id, name, slug)
        )
      `)
      .eq('id', id)
      .single();

    if (csError) {
      console.error('[SuggestReferences] Database error:', csError);
      return NextResponse.json(
        { error: 'Failed to fetch case study' },
        { status: 500 }
      );
    }

    if (!caseStudy) {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      );
    }

    // 3. Extract algorithms
    const algorithms = caseStudy.algorithm_case_study_relations
      ?.map((rel: any) => rel.algorithms)
      .filter(Boolean) || [];

    console.log(`[SuggestReferences] Found ${algorithms.length} algorithms`);

    if (algorithms.length === 0) {
      return NextResponse.json({
        success: true,
        caseStudyId: id,
        caseStudyTitle: caseStudy.title,
        algorithms: [],
        suggestions: {
          yaml: [],
          arxiv: [],
          semanticScholar: []
        },
        message: 'No algorithms associated with this case study',
        processingTime: Date.now() - startTime
      });
    }

    // 4. Parallel fetch from all sources
    console.log('[SuggestReferences] Starting parallel searches...');

    const yamlData = await loadYAMLReferences();

    const results = await Promise.allSettled([
      // YAML lookups (fast, always succeeds)
      Promise.all(
        algorithms.map((algo: any) =>
          getAlgorithmReferences(algo.slug, yamlData).map(ref =>
            formatReference(ref, 'yaml')
          )
        )
      ).then(refs => refs.flat()),

      // arXiv searches (slow, may fail)
      Promise.all(
        algorithms.map((algo: any) =>
          searchArxiv(algo.name, 3).catch(err => {
            console.error(`[SuggestReferences] arXiv search failed for ${algo.name}:`, err.message);
            return [];
          })
        )
      ).then(results =>
        results.flat().map(ref => formatReference(ref, 'arxiv'))
      ),

      // Semantic Scholar searches (slow, may fail)
      Promise.all(
        algorithms.map((algo: any) =>
          searchSemanticScholar(algo.name, 3).catch(err => {
            console.error(`[SuggestReferences] Semantic Scholar search failed for ${algo.name}:`, err.message);
            return [];
          })
        )
      ).then(results =>
        results.flat().map(ref => formatReference(ref, 'semantic-scholar'))
      )
    ]);

    // 5. Handle results (extract successful, log failures)
    const yamlRefs: FormattedReference[] = results[0].status === 'fulfilled' ? results[0].value : [];
    const arxivRefs: FormattedReference[] = results[1].status === 'fulfilled' ? results[1].value : [];
    const semanticRefs: FormattedReference[] = results[2].status === 'fulfilled' ? results[2].value : [];

    const errors: string[] = results
      .map((r, idx) => {
        if (r.status === 'rejected') {
          const sourceName = idx === 0 ? 'YAML' : idx === 1 ? 'arXiv' : 'Semantic Scholar';
          return `${sourceName}: ${r.reason?.message}`;
        }
        return null;
      })
      .filter((e): e is string => e !== null);

    if (errors.length > 0) {
      console.error('[SuggestReferences] Some searches failed:', errors);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[SuggestReferences] Completed in ${processingTime}ms`);
    console.log(`[SuggestReferences] Results: ${yamlRefs.length} YAML, ${arxivRefs.length} arXiv, ${semanticRefs.length} Semantic Scholar`);

    // 6. Return structured results
    return NextResponse.json({
      success: true,
      caseStudyId: id,
      caseStudyTitle: caseStudy.title,
      algorithms: algorithms.map((a: any) => ({ id: a.id, name: a.name, slug: a.slug })),
      suggestions: {
        yaml: yamlRefs,
        arxiv: arxivRefs,
        semanticScholar: semanticRefs
      },
      warnings: errors.length > 0 ? errors : undefined,
      processingTime
    });

  } catch (error) {
    console.error('[SuggestReferences] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch reference suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

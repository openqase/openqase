#!/usr/bin/env tsx
/**
 * Get all algorithms used in case studies
 * Output a list for creating academic reference mappings
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAlgorithms() {
  // Get all algorithms linked to case studies
  const { data: relations, error: relError } = await supabase
    .from('algorithm_case_study_relations')
    .select('algorithm_id');

  if (relError) {
    console.error('Error fetching relations:', relError);
    process.exit(1);
  }

  // Get unique algorithm IDs
  const algorithmIds = [...new Set(relations.map(r => r.algorithm_id).filter(Boolean))];

  console.log(`Found ${algorithmIds.length} unique algorithms used in case studies\n`);

  // Fetch algorithm details
  const { data: algorithms, error: algError } = await supabase
    .from('algorithms')
    .select('id, name, slug, description')
    .in('id', algorithmIds)
    .order('name');

  if (algError) {
    console.error('Error fetching algorithms:', algError);
    process.exit(1);
  }

  // Count case studies per algorithm
  const algorithmUsage = await Promise.all(
    algorithms!.map(async (algo) => {
      const { data: caseStudies } = await supabase
        .from('algorithm_case_study_relations')
        .select('case_study_id')
        .eq('algorithm_id', algo.id);

      return {
        ...algo,
        caseStudyCount: caseStudies?.length || 0
      };
    })
  );

  // Sort by usage (most used first)
  algorithmUsage.sort((a, b) => b.caseStudyCount - a.caseStudyCount);

  console.log('=== ALGORITHMS USED IN CASE STUDIES ===\n');
  console.log('Usage | Name');
  console.log('------|-----');

  algorithmUsage.forEach(algo => {
    console.log(`  ${algo.caseStudyCount.toString().padStart(2)}  | ${algo.name}`);
  });

  console.log('\n=== ALGORITHM DETAILS FOR REFERENCE MAPPING ===\n');

  algorithmUsage.forEach(algo => {
    console.log(`## ${algo.name} (${algo.caseStudyCount} case studies)`);
    console.log(`Slug: ${algo.slug}`);
    console.log(`Description: ${algo.description?.substring(0, 150)}...`);
    console.log('Academic References:');
    console.log('- [ ] TODO: Add foundational paper(s)');
    console.log('');
  });

  console.log('\n=== NEXT STEPS ===');
  console.log('1. For each algorithm above, find 1-3 foundational papers');
  console.log('2. Create algorithm-academic-references.yaml mapping file');
  console.log('3. Run script to bulk-add references to case studies');
}

getAlgorithms();

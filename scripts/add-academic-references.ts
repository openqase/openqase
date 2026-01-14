#!/usr/bin/env tsx
/**
 * Add academic references to case studies based on their linked algorithms
 *
 * Usage:
 *   npx tsx scripts/add-academic-references.ts --preview  # Show what would be added
 *   npx tsx scripts/add-academic-references.ts --apply    # Actually update database
 */

import { createClient } from '@supabase/supabase-js';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Load algorithm reference mappings
const referencesPath = path.join(process.cwd(), 'algorithm-academic-references.yaml');
const algorithmReferences = yaml.load(fs.readFileSync(referencesPath, 'utf8')) as any;

function formatReference(ref: any): string {
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

  // URL
  if (ref.url) {
    parts.push(`Available at: ${ref.url}`);
  }

  // Note (if any)
  if (ref.note) {
    parts.push(`(${ref.note})`);
  }

  return parts.join(' ');
}

async function generateReferencesForCaseStudy(caseStudyId: string): Promise<string[]> {
  // Get algorithms linked to this case study
  const { data: algorithmLinks } = await supabase
    .from('algorithm_case_study_relations')
    .select('algorithm_id')
    .eq('case_study_id', caseStudyId);

  if (!algorithmLinks || algorithmLinks.length === 0) {
    return [];
  }

  const algorithmIds = algorithmLinks.map(link => link.algorithm_id);

  // Fetch algorithm details
  const { data: algorithms } = await supabase
    .from('algorithms')
    .select('slug')
    .in('id', algorithmIds);

  if (!algorithms || algorithms.length === 0) {
    return [];
  }

  // Collect unique references
  const allReferences: string[] = [];
  const seenReferences = new Set<string>();

  for (const algo of algorithms) {
    const algoRefs = algorithmReferences[algo.slug];

    if (algoRefs && algoRefs.references) {
      for (const ref of algoRefs.references) {
        const formattedRef = formatReference(ref);

        // Avoid duplicates
        if (!seenReferences.has(formattedRef)) {
          seenReferences.add(formattedRef);
          allReferences.push(formattedRef);
        }
      }
    }
  }

  return allReferences;
}

async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview') || args.length === 0;
  const shouldApply = args.includes('--apply');

  if (!isPreview && !shouldApply) {
    console.log('Usage:');
    console.log('  npx tsx scripts/add-academic-references.ts --preview  # Show what would be added');
    console.log('  npx tsx scripts/add-academic-references.ts --apply    # Actually update database');
    process.exit(1);
  }

  // Get all published case studies
  const { data: caseStudies, error } = await supabase
    .from('case_studies')
    .select('id, slug, title, academic_references')
    .eq('published', true)
    .order('title');

  if (error) {
    console.error('Error fetching case studies:', error);
    process.exit(1);
  }

  console.log(`Found ${caseStudies.length} case studies\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const cs of caseStudies) {
    const references = await generateReferencesForCaseStudy(cs.id);

    if (references.length === 0) {
      console.log(`⚠️  ${cs.title} - No algorithms linked, skipping`);
      skippedCount++;
      continue;
    }

    const referenceText = references.join('\n\n');
    const hasExistingRefs = cs.academic_references && cs.academic_references.trim().length > 0;

    if (isPreview) {
      console.log(`\n📄 ${cs.title}`);
      console.log(`   Slug: ${cs.slug}`);
      console.log(`   Existing references: ${hasExistingRefs ? 'YES (will be preserved)' : 'NO'}`);
      console.log(`   Adding ${references.length} reference(s):\n`);

      references.forEach((ref, i) => {
        console.log(`   ${i + 1}. ${ref.substring(0, 120)}...`);
      });

      updatedCount++;
    } else if (shouldApply) {
      // Combine with existing references if any
      let finalReferences = referenceText;

      if (hasExistingRefs) {
        finalReferences = `${cs.academic_references}\n\n--- Algorithm References ---\n\n${referenceText}`;
      }

      const { error: updateError } = await supabase
        .from('case_studies')
        .update({ academic_references: finalReferences })
        .eq('id', cs.id);

      if (updateError) {
        console.error(`❌ Error updating ${cs.title}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ Updated ${cs.title} (${references.length} refs)`);
        updatedCount++;
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  if (isPreview) {
    console.log(`Would update: ${updatedCount} case studies`);
    console.log(`Would skip: ${skippedCount} case studies (no algorithms)`);
    console.log(`\n✨ Run with --apply to actually update the database`);
  } else {
    console.log(`✅ Updated: ${updatedCount} case studies`);
    console.log(`⚠️  Skipped: ${skippedCount} case studies (no algorithms)`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} case studies`);
    }
    console.log(`\n✨ Done! Run audit script to see improved scores.`);
  }
}

main();

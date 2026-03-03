#!/usr/bin/env tsx

/**
 * Batch import script with entity mapping for Qookie case study JSON files
 * Uses predefined mapping to OpenQase entities instead of fuzzy matching
 */

import { config } from 'dotenv';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import entityMapping from './entity-mapping.json';
import { generateNextBatchName } from './batch-name-generator';

// Load environment variables
config({ path: '.env.local' });

// Type definitions
interface EntityMapping {
  algorithms: Record<string, string | null>;
  industries: Record<string, string>;
  personas: Record<string, string>;
}

interface BatchImportResult {
  filePath: string;
  fileName: string;
  status: 'success' | 'duplicate' | 'error' | 'skipped';
  title?: string;
  slug?: string;
  duplicateInfo?: any[];
  entityMatches?: {
    algorithms: { mapped: number; unmapped: string[] };
    industries: { mapped: number; unmapped: string[] };
    personas: { mapped: number; unmapped: string[] };
  };
  contentStats?: {
    descriptionLength: number;
    mainContentLength: number;
    referencesCount: number;
  };
  error?: string;
}

// Load entity mapping
const mapping: EntityMapping = entityMapping as EntityMapping;

// Cache for entity lookups (populated once)
let entityCache: {
  algorithms: Map<string, string>;
  industries: Map<string, string>;
  personas: Map<string, string>;
} | null = null;

// Initialize entity cache from database
async function initializeEntityCache() {
  if (entityCache) return entityCache;

  const supabase = createServiceRoleSupabaseClient();
  
  const [algorithmsResult, industriesResult, personasResult] = await Promise.all([
    supabase.from('algorithms').select('id, slug'),
    supabase.from('industries').select('id, slug'),
    supabase.from('personas').select('id, slug')
  ]);

  entityCache = {
    algorithms: new Map(),
    industries: new Map(),
    personas: new Map()
  };

  // Build slug -> id mappings
  algorithmsResult.data?.forEach(alg => entityCache!.algorithms.set(alg.slug, alg.id));
  industriesResult.data?.forEach(ind => entityCache!.industries.set(ind.slug, ind.id));
  personasResult.data?.forEach(per => entityCache!.personas.set(per.slug, per.id));

  return entityCache;
}

// Map entities using predefined mapping
async function mapEntities(entityType: 'algorithms' | 'industries' | 'personas', names: string[]) {
  await initializeEntityCache();
  
  const results = {
    mapped: [] as string[],
    unmapped: [] as string[]
  };

  const typeMapping = mapping[entityType];
  const cache = entityCache![entityType];

  for (const name of names) {
    const mappedSlug = typeMapping[name];
    
    if (mappedSlug === null) {
      // Explicitly unmapped (like "Quantum Machine Learning")
      results.unmapped.push(name);
    } else if (mappedSlug && cache.has(mappedSlug)) {
      // Successfully mapped to existing entity
      results.mapped.push(cache.get(mappedSlug)!);
    } else if (mappedSlug) {
      // Mapped but entity doesn't exist in database
      console.warn(`⚠️  Mapped entity not found in database: ${name} -> ${mappedSlug}`);
      results.unmapped.push(name);
    } else {
      // No mapping defined
      results.unmapped.push(name);
    }
  }

  return results;
}

// Utility functions
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function checkForDuplicates(title: string, slug: string) {
  const supabase = createServiceRoleSupabaseClient();
  
  const { data: titleDuplicates, error: titleError } = await supabase
    .from('case_studies')
    .select('id, title, slug')
    .ilike('title', `%${title}%`);

  const { data: slugDuplicates, error: slugError } = await supabase
    .from('case_studies')
    .select('id, title, slug')
    .eq('slug', slug);

  if (titleError || slugError) {
    console.error('Error checking for duplicates:', titleError || slugError);
    return { hasDuplicates: false, duplicates: [] };
  }

  const allDuplicates = [
    ...(titleDuplicates || []),
    ...(slugDuplicates || [])
  ];

  const uniqueDuplicates = allDuplicates.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  );

  return { 
    hasDuplicates: uniqueDuplicates.length > 0, 
    duplicates: uniqueDuplicates
  };
}

function buildMainContent(caseStudy: any): string {
  return `## Introduction
${caseStudy.introduction}

## Challenge
${caseStudy.challenge}

## Solution
${caseStudy.solution}

## Implementation
${caseStudy.implementation}

## Results and Business Impact
${caseStudy.results_and_business_impact}

## Future Directions
${caseStudy.future_directions}`;
}

// Build academic references as formatted text
function buildAcademicReferences(caseStudy: any): string {
  const references = caseStudy.references || [];
  if (references.length === 0) return '';
  
  return references.map((ref: any, index: number) => {
    const num = index + 1;
    let citation = `[${num}]: `;
    
    if (ref.authors && ref.authors.length > 0) {
      citation += `${ref.authors.join(', ')}. `;
    }
    
    if (ref.title) {
      citation += `"${ref.title}". `;
    }
    
    if (ref.journal) {
      citation += `${ref.journal}`;
      if (ref.year) citation += ` (${ref.year})`;
      citation += '. ';
    } else if (ref.year) {
      citation += `${ref.year}. `;
    }
    
    if (ref.url) {
      citation += `${ref.url}`;
    }
    
    return citation.trim();
  }).join('\n\n');
}

// Build resource links as structured JSONB
function buildResourceLinks(caseStudy: any): any[] {
  return caseStudy.furtherReading || [];
}

// Process single case study with mapping
async function processCaseStudyFile(filePath: string): Promise<BatchImportResult> {
  const fileName = path.basename(filePath);
  const result: BatchImportResult = {
    filePath,
    fileName,
    status: 'error'
  };

  try {
    // Read and parse JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const caseStudy = JSON.parse(fileContent);

    // Validate required fields
    if (!caseStudy.title || !caseStudy.summary) {
      result.error = 'Missing required fields (title or summary)';
      return result;
    }

    // Use advancedMetadata if available, otherwise empty arrays (no fallback to basic metadata)
    const metadata = caseStudy.advancedMetadata || { algorithms: [], industries: [], personas: [] };

    result.title = caseStudy.title;
    const generatedSlug = generateSlug(caseStudy.title);
    result.slug = generatedSlug;

    // Check for duplicates
    const { hasDuplicates, duplicates } = await checkForDuplicates(caseStudy.title, generatedSlug);
    if (hasDuplicates) {
      result.status = 'duplicate';
      result.duplicateInfo = duplicates;
      return result;
    }

    // Map entities using predefined mapping
    const algorithmResults = await mapEntities('algorithms', metadata.algorithms || []);
    const industryResults = await mapEntities('industries', metadata.industries || []);
    const personaResults = await mapEntities('personas', metadata.personas || []);

    result.entityMatches = {
      algorithms: {
        mapped: algorithmResults.mapped.length,
        unmapped: algorithmResults.unmapped
      },
      industries: {
        mapped: industryResults.mapped.length,
        unmapped: industryResults.unmapped
      },
      personas: {
        mapped: personaResults.mapped.length,
        unmapped: personaResults.unmapped
      }
    };

    // Content stats
    const mainContent = buildMainContent(caseStudy);
    const academicReferences = buildAcademicReferences(caseStudy);
    const resourceLinks = buildResourceLinks(caseStudy);

    result.contentStats = {
      descriptionLength: caseStudy.summary.length,
      mainContentLength: mainContent.length,
      referencesCount: (caseStudy.references || []).length + (caseStudy.furtherReading || []).length
    };

    result.status = 'success';
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

// Import single case study to database
async function importCaseStudy(filePath: string, batchId?: string, batchName?: string): Promise<void> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const caseStudy = JSON.parse(fileContent);

  const slug = generateSlug(caseStudy.title);
  const mainContent = buildMainContent(caseStudy);
  const academicReferences = buildAcademicReferences(caseStudy);
  const resourceLinks = buildResourceLinks(caseStudy);

  // Generate batch ID if not provided
  const importBatchId = batchId || randomUUID();
  const fileName = path.basename(filePath, '.json');

  const caseStudyData = {
    title: caseStudy.title,
    slug: slug,
    description: caseStudy.summary,
    main_content: mainContent,
    academic_references: academicReferences || null,
    resource_links: resourceLinks.length > 0 ? resourceLinks : [],
    published: false,
    import_batch_id: importBatchId,
    import_batch_name: batchName || null,
    import_source: 'qookie-export',
    import_timestamp: new Date().toISOString(),
    original_qookie_id: caseStudy.id || null,
    original_qookie_slug: fileName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createServiceRoleSupabaseClient();

  // Insert case study
  const { data: insertedCaseStudy, error: insertError } = await supabase
    .from('case_studies')
    .insert(caseStudyData)
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Failed to insert case study: ${insertError.message}`);
  }

  const caseStudyId = insertedCaseStudy.id;

  // Map and insert relationships (use advancedMetadata if available, otherwise empty)
  const metadata = caseStudy.advancedMetadata || { algorithms: [], industries: [], personas: [] };
  const algorithmResults = await mapEntities('algorithms', metadata.algorithms || []);
  const industryResults = await mapEntities('industries', metadata.industries || []);
  const personaResults = await mapEntities('personas', metadata.personas || []);

  // Insert algorithm relationships
  if (algorithmResults.mapped.length > 0) {
    const algorithmRelations = algorithmResults.mapped.map(algId => ({
      case_study_id: caseStudyId,
      algorithm_id: algId
    }));

    const { error: algError } = await supabase
      .from('algorithm_case_study_relations')
      .insert(algorithmRelations);

    if (algError) {
      console.error(`Failed to insert algorithm relations for ${caseStudy.title}:`, algError);
    }
  }

  // Insert industry relationships
  if (industryResults.mapped.length > 0) {
    const industryRelations = industryResults.mapped.map(indId => ({
      case_study_id: caseStudyId,
      industry_id: indId
    }));

    const { error: indError } = await supabase
      .from('case_study_industry_relations')
      .insert(industryRelations);

    if (indError) {
      console.error(`Failed to insert industry relations for ${caseStudy.title}:`, indError);
    }
  }

  // Insert persona relationships
  if (personaResults.mapped.length > 0) {
    const personaRelations = personaResults.mapped.map(perId => ({
      case_study_id: caseStudyId,
      persona_id: perId
    }));

    const { error: perError } = await supabase
      .from('case_study_persona_relations')
      .insert(personaRelations);

    if (perError) {
      console.error(`Failed to insert persona relations for ${caseStudy.title}:`, perError);
    }
  }
}

// Find all JSON files
function findJsonFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  const files = fs.readdirSync(directory);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(directory, file))
    .sort();
}

// Generate report with mapping statistics
function generateMappingReport(results: BatchImportResult[]) {
  const successful = results.filter(r => r.status === 'success');
  
  let totalAlgorithmMappings = 0;
  let totalIndustryMappings = 0;
  let totalPersonaMappings = 0;
  let totalUnmappedAlgorithms = new Set<string>();
  let totalUnmappedIndustries = new Set<string>();
  let totalUnmappedPersonas = new Set<string>();

  successful.forEach(result => {
    if (result.entityMatches) {
      totalAlgorithmMappings += result.entityMatches.algorithms.mapped;
      totalIndustryMappings += result.entityMatches.industries.mapped;
      totalPersonaMappings += result.entityMatches.personas.mapped;
      
      result.entityMatches.algorithms.unmapped.forEach(alg => totalUnmappedAlgorithms.add(alg));
      result.entityMatches.industries.unmapped.forEach(ind => totalUnmappedIndustries.add(ind));
      result.entityMatches.personas.unmapped.forEach(per => totalUnmappedPersonas.add(per));
    }
  });

  console.log('\n🎯 ENTITY MAPPING REPORT');
  console.log('=======================');
  console.log(`\n📊 Mapping Success:`);
  console.log(`   ✅ Algorithm relationships: ${totalAlgorithmMappings}`);
  console.log(`   ✅ Industry relationships: ${totalIndustryMappings}`);
  console.log(`   ✅ Persona relationships: ${totalPersonaMappings}`);
  console.log(`   📈 Total relationships: ${totalAlgorithmMappings + totalIndustryMappings + totalPersonaMappings}`);

  if (totalUnmappedAlgorithms.size > 0) {
    console.log(`\n⚠️  Unmapped Algorithms (${totalUnmappedAlgorithms.size}):`);
    Array.from(totalUnmappedAlgorithms).forEach(alg => console.log(`   • ${alg}`));
  }

  if (totalUnmappedIndustries.size > 0) {
    console.log(`\n⚠️  Unmapped Industries (${totalUnmappedIndustries.size}):`);
    Array.from(totalUnmappedIndustries).forEach(ind => console.log(`   • ${ind}`));
  }

  if (totalUnmappedPersonas.size > 0) {
    console.log(`\n⚠️  Unmapped Personas (${totalUnmappedPersonas.size}):`);
    Array.from(totalUnmappedPersonas).forEach(per => console.log(`   • ${per}`));
  }

  return {
    totalMappings: totalAlgorithmMappings + totalIndustryMappings + totalPersonaMappings,
    algorithmMappings: totalAlgorithmMappings,
    industryMappings: totalIndustryMappings,
    personaMappings: totalPersonaMappings
  };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const directory = args[0];
  const commit = args.includes('--commit');

  if (!directory) {
    console.error('Usage: tsx scripts/import-case-studies-with-mapping.ts <directory> [--commit]');
    console.error('');
    console.error('Examples:');
    console.error('  tsx scripts/import-case-studies-with-mapping.ts /path/to/json/files');
    console.error('  tsx scripts/import-case-studies-with-mapping.ts /path/to/json/files --commit');
    process.exit(1);
  }

  console.log('🔍 Starting batch import with entity mapping...');
  console.log(`📁 Directory: ${directory}`);
  console.log(`🚫 Commit mode: ${commit ? 'YES (will import)' : 'NO (analysis only)'}`);

  // Initialize entity cache
  console.log('\n⚡ Loading entity mappings...');
  await initializeEntityCache();
  console.log(`   Cached ${entityCache!.algorithms.size} algorithms, ${entityCache!.industries.size} industries, ${entityCache!.personas.size} personas`);

  // Find and process files
  const jsonFiles = findJsonFiles(directory);
  console.log(`\n📄 Found ${jsonFiles.length} JSON files`);

  const results: BatchImportResult[] = [];
  for (let i = 0; i < jsonFiles.length; i++) {
    const filePath = jsonFiles[i];
    process.stdout.write(`\r   Analyzing ${i + 1}/${jsonFiles.length}...`);
    
    const result = await processCaseStudyFile(filePath);
    results.push(result);
  }

  console.log('\n✅ Analysis complete!');

  // Generate reports
  const successful = results.filter(r => r.status === 'success');
  const errors = results.filter(r => r.status === 'error');
  const duplicates = results.filter(r => r.status === 'duplicate');

  console.log(`\n📊 Results: ${successful.length} ready, ${duplicates.length} duplicates, ${errors.length} errors`);

  if (successful.length > 0) {
    generateMappingReport(results);
  }

  if (errors.length > 0) {
    console.log(`\n❌ Files with errors:`);
    errors.forEach(err => console.log(`   • ${err.fileName}: ${err.error}`));
  }

  // Import if commit mode
  if (commit && successful.length > 0) {
    // Generate batch ID and batch name for this import run
    const batchId = randomUUID();
    const batchName = await generateNextBatchName();
    const timestamp = new Date().toISOString();
    
    console.log(`\n🚀 Importing ${successful.length} case studies...`);
    console.log(`📦 Batch ID: ${batchId}`);
    console.log(`🏷️  Batch Name: ${batchName}`);
    console.log(`⏰ Started: ${timestamp}`);
    
    let imported = 0;
    for (const result of successful) {
      try {
        process.stdout.write(`\r   Importing ${imported + 1}/${successful.length}: ${result.title?.slice(0, 50)}...`);
        await importCaseStudy(result.filePath, batchId, batchName);
        imported++;
      } catch (error) {
        console.error(`\n❌ Failed to import ${result.fileName}:`, error);
      }
    }

    console.log(`\n🎉 Import completed! ${imported}/${successful.length} case studies imported successfully.`);
    console.log(`📦 Batch ID: ${batchId} (save this for rollback if needed)`);
    console.log(`🏷️  Batch Name: ${batchName} (for admin interface)`);
    console.log(`🔍 View imported case studies: SELECT * FROM case_studies WHERE import_batch_name = '${batchName}';`);
  } else if (!commit && successful.length > 0) {
    console.log(`\n📋 Next step: Run with --commit to import ${successful.length} case studies`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
import { createClient } from '@supabase/supabase-js';

// Use environment variables - defaults to local Supabase for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditCaseStudies() {
  // First, get one record to see schema
  const { data: sample, error: schemaError } = await supabase
    .from('case_studies')
    .select('*')
    .eq('published', true)
    .limit(1);

  if (schemaError) {
    console.error('Schema error:', schemaError);
    return;
  }

  console.log('=== CASE STUDY SCHEMA ===');
  console.log('Columns:', Object.keys(sample?.[0] || {}));
  console.log('\n');

  // Fetch all published case studies
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('published', true)
    .order('title');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`=== CASE STUDY AUDIT (${data.length} total) ===\n`);

  // Fetch junction table relationships
  const [algoRels, industryRels, personaRels] = await Promise.all([
    supabase.from('algorithm_case_study_relations').select('case_study_id, algorithm_id'),
    supabase.from('case_study_industry_relations').select('case_study_id, industry_id'),
    supabase.from('case_study_persona_relations').select('case_study_id, persona_id'),
  ]);

  // Create lookup maps for junction relations
  const algoMap = new Map<string, number>();
  (algoRels.data || []).forEach((r: any) => {
    algoMap.set(r.case_study_id, (algoMap.get(r.case_study_id) || 0) + 1);
  });

  const industryMap = new Map<string, number>();
  (industryRels.data || []).forEach((r: any) => {
    industryMap.set(r.case_study_id, (industryMap.get(r.case_study_id) || 0) + 1);
  });

  const personaMap = new Map<string, number>();
  (personaRels.data || []).forEach((r: any) => {
    personaMap.set(r.case_study_id, (personaMap.get(r.case_study_id) || 0) + 1);
  });

  // Analyze each case study
  const analysis = data.map((cs: any) => {
    // Note: field is main_content, not content
    const content = cs.main_content || '';

    // Junction table relationship counts
    const algorithmCount = algoMap.get(cs.id) || 0;
    const industryCount = industryMap.get(cs.id) || 0;
    const personaCount = personaMap.get(cs.id) || 0;

    const fields = {
      id: cs.id,
      title: cs.title,
      slug: cs.slug,
      description: !!cs.description,
      descriptionLength: cs.description?.length || 0,
      hasMainContent: !!content,
      contentLength: content.length,
      // Check for key sections in content
      hasQuantumAdvantage: content.toLowerCase().includes('quantum advantage'),
      hasResults: content.toLowerCase().includes('result'),
      hasImplementation: content.toLowerCase().includes('implement'),
      hasChallenge: content.toLowerCase().includes('challenge'),
      // Junction table relationships
      algorithmCount,
      industryCount,
      personaCount,
      hasAlgorithms: algorithmCount > 0,
      hasIndustries: industryCount > 0,
      hasPersonas: personaCount > 0,
      // Legacy string arrays for other relationships
      hasPartnerCompanies: Array.isArray(cs.partner_companies) && cs.partner_companies.length > 0,
      hasQuantumCompanies: Array.isArray(cs.quantum_companies) && cs.quantum_companies.length > 0,
      hasQuantumSoftware: Array.isArray(cs.quantum_software) && cs.quantum_software.length > 0,
      hasQuantumHardware: Array.isArray(cs.quantum_hardware) && cs.quantum_hardware.length > 0,
      hasAcademicRefs: Array.isArray(cs.academic_references) && cs.academic_references.length > 0,
      hasResourceLinks: Array.isArray(cs.resource_links) && cs.resource_links.length > 0,
      year: cs.year,
    };

    // Calculate completeness score (max 100)
    let score = 0;

    // Core content (50 points)
    if (fields.description) score += 10;
    if (fields.descriptionLength > 100) score += 5;
    if (fields.hasMainContent) score += 15;
    if (fields.contentLength > 500) score += 5;
    if (fields.contentLength > 1000) score += 5;
    if (fields.contentLength > 2000) score += 5;
    if (fields.contentLength > 4000) score += 5;

    // Content quality indicators (20 points)
    if (fields.hasQuantumAdvantage) score += 5;
    if (fields.hasResults) score += 5;
    if (fields.hasImplementation) score += 5;
    if (fields.hasChallenge) score += 5;

    // Relationships (25 points)
    if (fields.hasAlgorithms) score += 5;
    if (fields.hasIndustries) score += 5;
    if (fields.hasPersonas) score += 5;
    if (fields.hasPartnerCompanies || fields.hasQuantumCompanies) score += 5;
    if (fields.hasQuantumSoftware || fields.hasQuantumHardware) score += 5;

    // Supporting materials (10 points)
    if (fields.hasAcademicRefs) score += 5;
    if (fields.hasResourceLinks) score += 5;

    return {
      ...fields,
      score,
      updated_at: cs.updated_at,
    };
  });

  // Sort by score (lowest first - need most work)
  analysis.sort((a, b) => a.score - b.score);

  // Output results
  console.log('Case studies sorted by completeness score (lowest first):\n');
  console.log('Score | Content Length | Title');
  console.log('------|----------------|------');

  analysis.forEach((cs: any) => {
    const scoreStr = cs.score.toString().padStart(5);
    const lengthStr = cs.contentLength.toString().padStart(14);
    console.log(`${scoreStr} | ${lengthStr} | ${cs.title}`);
  });

  // Summary statistics
  console.log('\n=== SUMMARY STATISTICS ===');
  const avgScore = analysis.reduce((sum: number, cs: any) => sum + cs.score, 0) / analysis.length;
  const avgLength = analysis.reduce((sum: number, cs: any) => sum + cs.contentLength, 0) / analysis.length;
  const withDescription = analysis.filter((cs: any) => cs.description).length;
  const withContent = analysis.filter((cs: any) => cs.hasMainContent).length;
  const withAlgorithms = analysis.filter((cs: any) => cs.hasAlgorithms).length;
  const withPartners = analysis.filter((cs: any) => cs.hasPartnerCompanies).length;
  const withQuantumCos = analysis.filter((cs: any) => cs.hasQuantumCompanies).length;
  const withRefs = analysis.filter((cs: any) => cs.hasAcademicRefs).length;
  const withLinks = analysis.filter((cs: any) => cs.hasResourceLinks).length;

  const withIndustries = analysis.filter((cs: any) => cs.hasIndustries).length;
  const withPersonas = analysis.filter((cs: any) => cs.hasPersonas).length;
  const withSoftware = analysis.filter((cs: any) => cs.hasQuantumSoftware).length;
  const withHardware = analysis.filter((cs: any) => cs.hasQuantumHardware).length;

  console.log(`Average Score: ${avgScore.toFixed(1)}/100`);
  console.log(`Average Content Length: ${Math.round(avgLength)} characters`);
  console.log(`\nField Coverage:`);
  console.log(`  With Description: ${withDescription}/${analysis.length}`);
  console.log(`  With Main Content: ${withContent}/${analysis.length}`);
  console.log(`\nJunction Table Relations:`);
  console.log(`  With Algorithms: ${withAlgorithms}/${analysis.length}`);
  console.log(`  With Industries: ${withIndustries}/${analysis.length}`);
  console.log(`  With Personas: ${withPersonas}/${analysis.length}`);
  console.log(`\nLegacy String Array Relations:`);
  console.log(`  With Partner Companies: ${withPartners}/${analysis.length}`);
  console.log(`  With Quantum Companies: ${withQuantumCos}/${analysis.length}`);
  console.log(`  With Quantum Software: ${withSoftware}/${analysis.length}`);
  console.log(`  With Quantum Hardware: ${withHardware}/${analysis.length}`);
  console.log(`\nSupporting Materials:`);
  console.log(`  With Academic Refs: ${withRefs}/${analysis.length}`);
  console.log(`  With Resource Links: ${withLinks}/${analysis.length}`);

  // Categories
  const excellent = analysis.filter((cs: any) => cs.score >= 80).length;
  const good = analysis.filter((cs: any) => cs.score >= 60 && cs.score < 80).length;
  const needsWork = analysis.filter((cs: any) => cs.score >= 40 && cs.score < 60).length;
  const poor = analysis.filter((cs: any) => cs.score < 40).length;

  console.log(`\nQuality Distribution:`);
  console.log(`  Excellent (80+): ${excellent}`);
  console.log(`  Good (60-79): ${good}`);
  console.log(`  Needs Work (40-59): ${needsWork}`);
  console.log(`  Poor (<40): ${poor}`);

  // Top 10 needing most work
  console.log('\n=== TOP 10 NEEDING MOST WORK ===');
  analysis.slice(0, 10).forEach((cs: any, i: number) => {
    const missing: string[] = [];
    if (!cs.description) missing.push('description');
    if (!cs.hasMainContent) missing.push('main_content');
    if (!cs.hasAlgorithms) missing.push('algorithms');
    if (!cs.hasIndustries) missing.push('industries');
    if (!cs.hasPersonas) missing.push('personas');
    if (!cs.hasAcademicRefs) missing.push('academic_refs');
    if (!cs.hasResourceLinks) missing.push('resource_links');

    console.log(`\n${i + 1}. ${cs.title} (Score: ${cs.score})`);
    console.log(`   Slug: ${cs.slug}`);
    console.log(`   Description: ${cs.descriptionLength} chars | Content: ${cs.contentLength} chars`);
    console.log(`   Relations: ${cs.algorithmCount} algos, ${cs.industryCount} industries, ${cs.personaCount} personas`);
    console.log(`   Missing: ${missing.join(', ') || 'none'}`);
  });

  // Also show top 5 best case studies for reference
  console.log('\n=== TOP 5 BEST CASE STUDIES (for reference) ===');
  const best = [...analysis].sort((a, b) => b.score - a.score).slice(0, 5);
  best.forEach((cs: any, i: number) => {
    console.log(`\n${i + 1}. ${cs.title} (Score: ${cs.score})`);
    console.log(`   Slug: ${cs.slug}`);
    console.log(`   Description: ${cs.descriptionLength} chars | Content: ${cs.contentLength} chars`);
  });
}

auditCaseStudies();

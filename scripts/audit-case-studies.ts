import { createClient } from '@supabase/supabase-js';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Use environment variables - defaults to local Supabase for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Load quality standards
const standardsPath = path.join(process.cwd(), 'content-quality-standards.yaml');
const standards = yaml.load(fs.readFileSync(standardsPath, 'utf8')) as any;

// Quality detection functions
function detectAISlopPhrases(content: string): { phrase: string; count: number }[] {
  const slopPhrases = standards.case_studies.quality_indicators.negative_signals.generic_marketing.phrases;
  const detected: { phrase: string; count: number }[] = [];

  for (const phrase of slopPhrases) {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      detected.push({ phrase, count: matches.length });
    }
  }

  return detected;
}

function detectVagueOutcomes(content: string): { phrase: string; count: number }[] {
  const vaguePhrases = standards.case_studies.quality_indicators.negative_signals.vague_outcomes.phrases;
  const detected: { phrase: string; count: number }[] = [];

  for (const phrase of vaguePhrases) {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      detected.push({ phrase, count: matches.length });
    }
  }

  return detected;
}

function detectWeaselWords(content: string): { phrase: string; count: number }[] {
  const weaselPhrases = standards.case_studies.quality_indicators.negative_signals.weasel_words.phrases;
  const detected: { phrase: string; count: number }[] = [];

  for (const phrase of weaselPhrases) {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      detected.push({ phrase, count: matches.length });
    }
  }

  return detected;
}

function detectQuantifiedResults(content: string): string[] {
  const patterns = standards.case_studies.quality_indicators.positive_signals.quantified_results.patterns;
  const found: string[] = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    if (matches) {
      found.push(...matches);
    }
  }

  return found;
}

function detectTechnicalDepth(content: string): number {
  const keywords = standards.case_studies.quality_indicators.positive_signals.technical_depth.keywords;
  let matchCount = 0;

  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    if (matches) {
      matchCount++;
    }
  }

  return matchCount;
}

function calculateQualityScore(analysis: any): { score: number; breakdown: any } {
  let score = 0;
  const breakdown: any = {
    base: 0,
    relationships: 0,
    quality_bonuses: 0,
    penalties: 0
  };

  // Base score from required fields (40 points)
  if (analysis.description) breakdown.base += 10;
  if (analysis.descriptionLength >= 100) breakdown.base += 5;
  if (analysis.descriptionLength <= 250) breakdown.base += 5;
  if (analysis.hasMainContent) breakdown.base += 10;
  if (analysis.contentLength >= 500) breakdown.base += 10;

  // Relationships (40 points total)
  // Required (30 points)
  if (analysis.algorithmCount > 0) breakdown.relationships += 10;
  if (analysis.industryCount > 0) breakdown.relationships += 10;
  if (analysis.quantumCompanyCount > 0) breakdown.relationships += 10;

  // Recommended (10 points)
  if (analysis.personaCount > 0) breakdown.relationships += 3;
  if (analysis.partnerCompanyCount > 0) breakdown.relationships += 2;
  if (analysis.hardwareCount > 0) breakdown.relationships += 3;
  if (analysis.softwareCount > 0) breakdown.relationships += 2;

  // Quality bonuses (20 points)
  if (analysis.hasAcademicRefs) breakdown.quality_bonuses += 5;
  if (analysis.hasResourceLinks) breakdown.quality_bonuses += 5;
  if (analysis.quantifiedResults > 0) breakdown.quality_bonuses += 5;
  if (analysis.technicalDepth >= 3) breakdown.quality_bonuses += 5;

  // Penalties for AI slop
  if (analysis.aiSlopCount > 2) breakdown.penalties -= 5;
  if (analysis.vagueOutcomesCount > 2) breakdown.penalties -= 5;
  if (analysis.weaselWordsCount > 2) breakdown.penalties -= 5;

  score = breakdown.base + breakdown.relationships + breakdown.quality_bonuses + breakdown.penalties;

  return { score: Math.max(0, Math.min(100, score)), breakdown };
}

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
    const fullText = `${cs.title || ''} ${cs.description || ''} ${content}`;

    // Junction table relationship counts
    const algorithmCount = algoMap.get(cs.id) || 0;
    const industryCount = industryMap.get(cs.id) || 0;
    const personaCount = personaMap.get(cs.id) || 0;

    // Quality detection
    const aiSlopPhrases = detectAISlopPhrases(fullText);
    const vagueOutcomes = detectVagueOutcomes(fullText);
    const weaselWords = detectWeaselWords(fullText);
    const quantifiedResults = detectQuantifiedResults(fullText);
    const technicalDepth = detectTechnicalDepth(fullText);

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
      partnerCompanyCount: Array.isArray(cs.partner_companies) ? cs.partner_companies.length : 0,
      quantumCompanyCount: Array.isArray(cs.quantum_companies) ? cs.quantum_companies.length : 0,
      softwareCount: Array.isArray(cs.quantum_software) ? cs.quantum_software.length : 0,
      hardwareCount: Array.isArray(cs.quantum_hardware) ? cs.quantum_hardware.length : 0,
      hasAcademicRefs: Array.isArray(cs.academic_references) && cs.academic_references.length > 0,
      hasResourceLinks: Array.isArray(cs.resource_links) && cs.resource_links.length > 0,
      year: cs.year,
      // Quality metrics
      aiSlopPhrases,
      aiSlopCount: aiSlopPhrases.reduce((sum, p) => sum + p.count, 0),
      vagueOutcomes,
      vagueOutcomesCount: vagueOutcomes.reduce((sum, p) => sum + p.count, 0),
      weaselWords,
      weaselWordsCount: weaselWords.reduce((sum, p) => sum + p.count, 0),
      quantifiedResults,
      technicalDepth,
    };

    // Calculate quality score using new system
    const { score, breakdown } = calculateQualityScore(fields);

    return {
      ...fields,
      score,
      scoreBreakdown: breakdown,
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

  // Quality metrics
  const withAISlop = analysis.filter((cs: any) => cs.aiSlopCount > 0).length;
  const withVagueOutcomes = analysis.filter((cs: any) => cs.vagueOutcomesCount > 0).length;
  const withWeaselWords = analysis.filter((cs: any) => cs.weaselWordsCount > 0).length;
  const withQuantifiedResults = analysis.filter((cs: any) => cs.quantifiedResults.length > 0).length;
  const withGoodTechnicalDepth = analysis.filter((cs: any) => cs.technicalDepth >= 3).length;

  const totalAISlop = analysis.reduce((sum: number, cs: any) => sum + cs.aiSlopCount, 0);
  const totalVagueOutcomes = analysis.reduce((sum: number, cs: any) => sum + cs.vagueOutcomesCount, 0);
  const totalWeaselWords = analysis.reduce((sum: number, cs: any) => sum + cs.weaselWordsCount, 0);

  console.log(`Average Quality Score: ${avgScore.toFixed(1)}/100`);
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

  console.log(`\n🎯 QUALITY ANALYSIS (AI Slop Detection):`);
  console.log(`  With AI Slop Phrases: ${withAISlop}/${analysis.length} (${totalAISlop} total occurrences)`);
  console.log(`  With Vague Outcomes: ${withVagueOutcomes}/${analysis.length} (${totalVagueOutcomes} total occurrences)`);
  console.log(`  With Weasel Words: ${withWeaselWords}/${analysis.length} (${totalWeaselWords} total occurrences)`);
  console.log(`  With Quantified Results: ${withQuantifiedResults}/${analysis.length}`);
  console.log(`  With Good Technical Depth (3+ keywords): ${withGoodTechnicalDepth}/${analysis.length}`);

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

    const qualityIssues: string[] = [];
    if (cs.aiSlopCount > 0) qualityIssues.push(`${cs.aiSlopCount} AI slop phrases`);
    if (cs.vagueOutcomesCount > 0) qualityIssues.push(`${cs.vagueOutcomesCount} vague outcomes`);
    if (cs.weaselWordsCount > 0) qualityIssues.push(`${cs.weaselWordsCount} weasel words`);
    if (cs.quantifiedResults.length === 0) qualityIssues.push('no quantified results');
    if (cs.technicalDepth < 3) qualityIssues.push(`low technical depth (${cs.technicalDepth}/8)`);

    console.log(`\n${i + 1}. ${cs.title} (Score: ${cs.score}/100)`);
    console.log(`   Slug: ${cs.slug}`);
    console.log(`   Score Breakdown: Base:${cs.scoreBreakdown.base} | Relations:${cs.scoreBreakdown.relationships} | Quality:${cs.scoreBreakdown.quality_bonuses} | Penalties:${cs.scoreBreakdown.penalties}`);
    console.log(`   Description: ${cs.descriptionLength} chars | Content: ${cs.contentLength} chars`);
    console.log(`   Relations: ${cs.algorithmCount} algos, ${cs.industryCount} industries, ${cs.personaCount} personas`);
    if (missing.length > 0) console.log(`   ❌ Missing: ${missing.join(', ')}`);
    if (qualityIssues.length > 0) console.log(`   ⚠️  Quality Issues: ${qualityIssues.join(', ')}`);

    // Show specific AI slop phrases detected
    if (cs.aiSlopPhrases.length > 0) {
      console.log(`   🤖 AI Slop Detected: ${cs.aiSlopPhrases.map((p: any) => `"${p.phrase}" (${p.count}x)`).join(', ')}`);
    }
    if (cs.vagueOutcomes.length > 0 && cs.vagueOutcomes.length <= 3) {
      console.log(`   💭 Vague Outcomes: ${cs.vagueOutcomes.map((p: any) => `"${p.phrase}"`).join(', ')}`);
    }
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

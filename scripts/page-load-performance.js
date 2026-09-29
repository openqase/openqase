#!/usr/bin/env node

/**
 * Page Load Performance Test
 * Simulates actual page loads to identify real-world performance bottlenecks
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function measurePageLoad(pageName, loadFn) {
  console.log(`\n🔍 Loading: ${pageName}`);
  const start = performance.now();
  
  try {
    const result = await loadFn();
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.log(`✅ ${pageName}: ${duration}ms`);
    if (result.error) {
      console.log(`❌ Error: ${result.error.message}`);
    }
    
    return { pageName, duration, error: result.error };
  } catch (error) {
    const end = performance.now();
    const duration = Math.round(end - start);
    console.log(`❌ ${pageName}: ${duration}ms (ERROR: ${error.message})`);
    return { pageName, duration, error: error.message };
  }
}

async function loadPersonaPage(slug) {
  // Simulate what happens when you load /paths/persona/[slug]
  const queries = [];
  
  // 1. Get the persona
  const personaStart = performance.now();
  const persona = await supabase
    .from('personas')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  const personaTime = performance.now() - personaStart;
  queries.push({ name: 'Persona Query', time: personaTime, records: persona.data ? 1 : 0 });

  if (!persona.data) {
    return { queries, totalTime: personaTime, error: 'Persona not found' };
  }

  // 2. Get related industries via junction table
  const industriesStart = performance.now();
  const industries = await supabase
    .from('persona_industry_relations')
    .select(`
      industries (
        id, name, slug, description, icon
      )
    `)
    .eq('persona_id', persona.data.id);
  const industriesTime = performance.now() - industriesStart;
  queries.push({ name: 'Related Industries', time: industriesTime, records: industries.data?.length || 0 });

  // 3. Get related algorithms via junction table
  const algorithmsStart = performance.now();
  const algorithms = await supabase
    .from('persona_algorithm_relations')
    .select(`
      algorithms (
        id, name, slug, description, quantum_advantage
      )
    `)
    .eq('persona_id', persona.data.id);
  const algorithmsTime = performance.now() - algorithmsStart;
  queries.push({ name: 'Related Algorithms', time: algorithmsTime, records: algorithms.data?.length || 0 });

  // 4. Get related case studies via junction table
  const caseStudiesStart = performance.now();
  const caseStudies = await supabase
    .from('case_study_persona_relations')
    .select(`
      case_studies (
        id, title, slug, description, published
      )
    `)
    .eq('persona_id', persona.data.id)
    .eq('case_studies.published', true);
  const caseStudiesTime = performance.now() - caseStudiesStart;
  queries.push({ name: 'Related Case Studies', time: caseStudiesTime, records: caseStudies.data?.length || 0 });

  const totalTime = queries.reduce((sum, q) => sum + q.time, 0);
  
  console.log(`    📊 Query Breakdown:`);
  queries.forEach(q => {
    console.log(`      - ${q.name}: ${Math.round(q.time)}ms (${q.records} records)`);
  });

  return { queries, totalTime, data: { persona, industries, algorithms, caseStudies } };
}

async function loadCaseStudyPage(slug) {
  // Simulate what happens when you load /case-study/[slug]
  const queries = [];
  
  // 1. Get the case study
  const caseStudyStart = performance.now();
  const caseStudy = await supabase
    .from('case_studies')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  const caseStudyTime = performance.now() - caseStudyStart;
  queries.push({ name: 'Case Study Query', time: caseStudyTime, records: caseStudy.data ? 1 : 0 });

  if (!caseStudy.data) {
    return { queries, totalTime: caseStudyTime, error: 'Case study not found' };
  }

  // 2. Get related industries
  const industriesStart = performance.now();
  const industries = await supabase
    .from('case_study_industry_relations')
    .select(`
      industries (
        id, name, slug, description, icon
      )
    `)
    .eq('case_study_id', caseStudy.data.id);
  const industriesTime = performance.now() - industriesStart;
  queries.push({ name: 'Related Industries', time: industriesTime, records: industries.data?.length || 0 });

  // 3. Get related personas
  const personasStart = performance.now();
  const personas = await supabase
    .from('case_study_persona_relations')
    .select(`
      personas (
        id, name, slug, description
      )
    `)
    .eq('case_study_id', caseStudy.data.id);
  const personasTime = performance.now() - personasStart;
  queries.push({ name: 'Related Personas', time: personasTime, records: personas.data?.length || 0 });

  // 4. Get related algorithms
  const algorithmsStart = performance.now();
  const algorithms = await supabase
    .from('algorithm_case_study_relations')
    .select(`
      algorithms (
        id, name, slug, description, quantum_advantage
      )
    `)
    .eq('case_study_id', caseStudy.data.id);
  const algorithmsTime = performance.now() - algorithmsStart;
  queries.push({ name: 'Related Algorithms', time: algorithmsTime, records: algorithms.data?.length || 0 });

  const totalTime = queries.reduce((sum, q) => sum + q.time, 0);
  
  console.log(`    📊 Query Breakdown:`);
  queries.forEach(q => {
    console.log(`      - ${q.name}: ${Math.round(q.time)}ms (${q.records} records)`);
  });

  return { queries, totalTime, data: { caseStudy, industries, personas, algorithms } };
}

async function loadAdminPage() {

  const start = performance.now();
  const [
    caseStudiesResponse,
    algorithmsResponse,
    industriesResponse,
    personasResponse,
    blogPostsResponse
  ] = await Promise.all([
    supabase.from('case_studies').select('id', { count: 'exact', head: true }),
    supabase.from('algorithms').select('id', { count: 'exact', head: true }),
    supabase.from('industries').select('id', { count: 'exact', head: true }),
    supabase.from('personas').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true })
  ]);
  const totalTime = performance.now() - start;

  console.log(`    📊 Parallel count queries: ${Math.round(totalTime)}ms`);
  
  return { 
    queries: [{ name: 'All Count Queries (Parallel)', time: totalTime, records: 5 }], 
    totalTime,
    data: {
      caseStudies: caseStudiesResponse.count || 0,
      algorithms: algorithmsResponse.count || 0,
      industries: industriesResponse.count || 0,
      personas: personasResponse.count || 0,
      blogPosts: blogPostsResponse.count || 0
    }
  };
}

async function runPageLoadTests() {
  console.log('🚀 OpenQase Page Load Performance Test');
  console.log('======================================');
  
  const results = [];

  // Test real page loads
  results.push(await measurePageLoad(
    'Admin Dashboard',
    () => loadAdminPage()
  ));

  // Get some real slugs from the database first
  const { data: personas } = await supabase
    .from('personas')
    .select('slug')
    .eq('published', true)
    .limit(3);

  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('slug')
    .eq('published', true)
    .limit(3);

  // Test persona pages
  if (personas && personas.length > 0) {
    for (const persona of personas.slice(0, 2)) {
      results.push(await measurePageLoad(
        `Persona Page: ${persona.slug}`,
        () => loadPersonaPage(persona.slug)
      ));
    }
  }

  // Test case study pages
  if (caseStudies && caseStudies.length > 0) {
    for (const caseStudy of caseStudies.slice(0, 2)) {
      results.push(await measurePageLoad(
        `Case Study Page: ${caseStudy.slug}`,
        () => loadCaseStudyPage(caseStudy.slug)
      ));
    }
  }

  // Summary
  console.log('\n📊 PAGE LOAD PERFORMANCE SUMMARY');
  console.log('=================================');
  
  const successfulLoads = results.filter(r => !r.error);
  const averageTime = Math.round(
    successfulLoads.reduce((sum, r) => sum + r.duration, 0) / successfulLoads.length
  );
  const slowestPage = results.reduce((max, r) => r.duration > max.duration ? r : max);
  const fastestPage = successfulLoads.reduce((min, r) => r.duration < min.duration ? r : min);

  console.log(`Total Pages Tested: ${results.length}`);
  console.log(`Successful Loads: ${successfulLoads.length}`);
  console.log(`Average Load Time: ${averageTime}ms`);
  console.log(`Fastest Page: ${fastestPage.pageName} (${fastestPage.duration}ms)`);
  console.log(`Slowest Page: ${slowestPage.pageName} (${slowestPage.duration}ms)`);

  // Identify performance issues
  console.log('\n⚠️  PERFORMANCE ISSUES');
  console.log('======================');
  
  const slowPages = results.filter(r => r.duration > 200);
  if (slowPages.length > 0) {
    console.log('Pages taking >200ms:');
    slowPages.forEach(p => {
      console.log(`  - ${p.pageName}: ${p.duration}ms`);
    });
  }

  const verySlowPages = results.filter(r => r.duration > 500);
  if (verySlowPages.length > 0) {
    console.log('\n🚨 CRITICAL: Pages taking >500ms:');
    verySlowPages.forEach(p => {
      console.log(`  - ${p.pageName}: ${p.duration}ms`);
    });
  }

  if (slowPages.length === 0) {
    console.log('✅ All pages load under 200ms - Good performance!');
  }

  console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS');
  console.log('===============================');
  
  if (slowPages.length > 0) {
    console.log('1. 🔥 CRITICAL: Add indexes on foreign keys in junction tables');
    console.log('2. 🔥 CRITICAL: Optimize RLS policies with subqueries');
    console.log('3. 📊 Consider using single queries with joins instead of multiple queries');
    console.log('4. 💾 Implement caching for related data');
    console.log('5. 🔍 Review RLS policy execution plans');
  } else {
    console.log('1. 📊 Consider implementing caching for even better performance');
    console.log('2. 🔍 Monitor performance as data grows');
    console.log('3. 📈 Consider pagination for large result sets');
  }
  
  return results;
}

// Run the page load tests
runPageLoadTests()
  .then(() => {
    console.log('\n✅ Page load test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Page load test failed:', error);
    process.exit(1);
  }); 
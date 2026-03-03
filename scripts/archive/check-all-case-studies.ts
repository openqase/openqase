import { createClient } from '@supabase/supabase-js';

// Use environment variables - defaults to local Supabase for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllCaseStudies() {
  // Get all case studies regardless of published status
  const { data, error } = await supabase
    .from('case_studies')
    .select('id, title, slug, published, deleted_at, main_content')
    .order('title');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== ALL CASE STUDIES ===');
  console.log('Total in database:', data?.length);

  const published = data?.filter(cs => cs.published === true && cs.deleted_at === null) || [];
  const drafts = data?.filter(cs => cs.published === false && cs.deleted_at === null) || [];
  const deleted = data?.filter(cs => cs.deleted_at !== null) || [];

  console.log('\nBreakdown:');
  console.log('  Published:', published.length);
  console.log('  Drafts (unpublished):', drafts.length);
  console.log('  Soft-deleted:', deleted.length);

  // Analyze drafts
  if (drafts.length > 0) {
    console.log('\n=== DRAFT CASE STUDIES ===');

    const draftsWithContent = drafts.filter(cs => cs.main_content && cs.main_content.length > 100);
    const draftsNoContent = drafts.filter(cs => !cs.main_content || cs.main_content.length <= 100);

    console.log(`\nDrafts with substantial content (>100 chars): ${draftsWithContent.length}`);
    console.log(`Drafts with little/no content: ${draftsNoContent.length}`);

    console.log('\n--- Drafts WITH Content (ready to publish?) ---');
    draftsWithContent.slice(0, 20).forEach((cs, i) => {
      console.log(`${i+1}. ${cs.title || '(no title)'}`);
      console.log(`   Slug: ${cs.slug || '(no slug)'}`);
      console.log(`   Content: ${cs.main_content?.length || 0} chars`);
    });

    if (draftsWithContent.length > 20) {
      console.log(`... and ${draftsWithContent.length - 20} more with content`);
    }

    console.log('\n--- Drafts WITHOUT Content (stubs) ---');
    draftsNoContent.slice(0, 10).forEach((cs, i) => {
      console.log(`${i+1}. ${cs.title || '(no title)'}`);
      console.log(`   Slug: ${cs.slug || '(no slug)'}`);
    });

    if (draftsNoContent.length > 10) {
      console.log(`... and ${draftsNoContent.length - 10} more stubs`);
    }
  }

  // Show deleted
  if (deleted.length > 0) {
    console.log('\n=== SOFT-DELETED CASE STUDIES ===');
    deleted.forEach((cs, i) => {
      console.log(`${i+1}. ${cs.title || '(no title)'}`);
      console.log(`   Deleted at: ${cs.deleted_at}`);
    });
  }
}

checkAllCaseStudies();

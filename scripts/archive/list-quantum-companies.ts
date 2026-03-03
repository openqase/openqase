import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

// Read from .env.local file directly since we're running as a script
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function listCompanies() {
  const { data, error } = await supabase
    .from('quantum_companies')
    .select('name, slug, main_content')
    .order('name');

  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }

  console.log('Quantum Companies in database:');
  console.log('================================');
  data?.forEach(company => {
    const hasContent = company.main_content && company.main_content.length > 100;
    console.log(`${hasContent ? '✓' : ' '} ${company.slug}: ${company.name}`);
  });
  
  const withContent = data?.filter(c => c.main_content && c.main_content.length > 100).length || 0;
  const total = data?.length || 0;
  console.log(`\nProgress: ${withContent}/${total} companies have content`);
}

listCompanies().catch(console.error);
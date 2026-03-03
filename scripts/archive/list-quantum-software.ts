import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';
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

async function listQuantumSoftware() {
  const { data, error } = await supabase
    .from('quantum_software')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching quantum software:', error);
    return;
  }

  console.log('Quantum Software in database:');
  console.log('================================');
  data?.forEach(sw => {
    const hasContent = sw.main_content && sw.main_content.length > 100;
    console.log(`${hasContent ? '✓' : ' '} ${sw.slug}: ${sw.name} (${sw.vendor || 'N/A'})`);
  });
  
  const withContent = data?.filter(s => s.main_content && s.main_content.length > 100).length || 0;
  const total = data?.length || 0;
  console.log(`\nProgress: ${withContent}/${total} software platforms have content`);
}

listQuantumSoftware().catch(console.error);
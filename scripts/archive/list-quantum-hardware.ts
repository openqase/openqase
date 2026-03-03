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

async function listQuantumHardware() {
  const { data, error } = await supabase
    .from('quantum_hardware')
    .select('name, slug, vendor, technology_type, qubit_count, main_content')
    .order('name');

  if (error) {
    console.error('Error fetching quantum hardware:', error);
    return;
  }

  console.log('Quantum Hardware in database:');
  console.log('================================');
  data?.forEach(hw => {
    const hasContent = hw.main_content && hw.main_content.length > 100;
    console.log(`${hasContent ? '✓' : ' '} ${hw.slug}: ${hw.name} (${hw.vendor || 'N/A'}) - ${hw.technology_type || 'N/A'} - ${hw.qubit_count || '?'} qubits`);
  });
  
  const withContent = data?.filter(h => h.main_content && h.main_content.length > 100).length || 0;
  const total = data?.length || 0;
  console.log(`\nProgress: ${withContent}/${total} hardware systems have content`);
}

listQuantumHardware().catch(console.error);
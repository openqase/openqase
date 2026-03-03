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

const supabase = createClient<Database>(
  envVars.NEXT_PUBLIC_SUPABASE_URL, 
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  // Copy Google content to google-quantum-ai
  const { data: google } = await supabase
    .from('quantum_companies')
    .select('main_content')
    .eq('slug', 'google')
    .single();
    
  if (google?.main_content) {
    await supabase
      .from('quantum_companies')
      .update({ main_content: google.main_content })
      .eq('slug', 'google-quantum-ai');
    console.log('✓ Fixed google-quantum-ai');
  }

  // Copy Rigetti content to rigetti-computing  
  const { data: rigetti } = await supabase
    .from('quantum_companies')
    .select('main_content')
    .eq('slug', 'rigetti')
    .single();
    
  if (rigetti?.main_content) {
    await supabase
      .from('quantum_companies')
      .update({ main_content: rigetti.main_content })
      .eq('slug', 'rigetti-computing');
    console.log('✓ Fixed rigetti-computing');
  }
}

fix().catch(console.error);
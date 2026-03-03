#!/usr/bin/env tsx

/**
 * Batch name generator utility
 * Generates sequential batch names in format: QK-001, QK-002, etc.
 */

import { config } from 'dotenv';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

// Load environment variables
config({ path: '.env.local' });

/**
 * Generate next available batch name for Qookie imports
 * Format: QK-001, QK-002, etc.
 */
export async function generateNextBatchName(): Promise<string> {
  const supabase = createServiceRoleSupabaseClient();
  
  // Find the highest existing batch number
  const { data: existingBatches, error } = await supabase
    .from('case_studies')
    .select('import_batch_name')
    .like('import_batch_name', 'QK-%')
    .order('import_batch_name', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching existing batch names:', error);
    return 'QK-001'; // Default to first batch if error
  }

  let nextNumber = 1;
  
  if (existingBatches && existingBatches.length > 0) {
    const lastBatchName = existingBatches[0].import_batch_name;
    if (lastBatchName && lastBatchName.startsWith('QK-')) {
      const lastNumber = parseInt(lastBatchName.split('-')[1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }

  // Format as QK-001, QK-002, etc.
  return `QK-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Test function to verify batch name generation
 */
async function testBatchNameGeneration() {
  console.log('🧪 Testing batch name generation...');
  
  const batchName = await generateNextBatchName();
  console.log(`✅ Generated batch name: ${batchName}`);
  
  // Test sequential generation
  console.log('\n📊 Testing sequential generation:');
  for (let i = 0; i < 3; i++) {
    const name = await generateNextBatchName();
    console.log(`   Test ${i + 1}: ${name}`);
  }
}

// Run test if called directly
if (require.main === module) {
  testBatchNameGeneration().catch(console.error);
}
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { BulkActionSchema } from '@/lib/schemas/bulk-action';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = BulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { id } = parsed.data;

    const supabase = createServiceRoleSupabaseClient();
    
    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('quantum_hardware')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id!);
      
    if (error) {
      console.error('Error deleting quantum hardware:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in quantum-hardware DELETE:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
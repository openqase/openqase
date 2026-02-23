import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createServiceRoleSupabaseClient();
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    
    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('partner_companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting partner company:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in partner-companies DELETE:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
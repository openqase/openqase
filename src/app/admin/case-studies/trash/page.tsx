import { Metadata } from 'next'
import { createServiceRoleSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { TrashClient } from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trash - Case Studies',
  description: 'Manage deleted case studies'
}

export type CaseStudy = Database['public']['Tables']['case_studies']['Row']

export default async function TrashPage() {
  try {
    const supabase = await createServiceRoleSupabaseClient();

    const { data: deletedItems, error } = await supabase
      .from('case_studies')
      .select(`
        *,
        deleted_by_user:deleted_by (
          email
        )
      `)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('Error fetching deleted case studies:', error)
      return <div>Error loading trash: {error.message}</div>
    }

    // Flatten the deleted_by_user data
    const flattenedItems = (deletedItems || []).map((item: any) => ({
      ...item,
      deleted_by_email: item.deleted_by_user?.email || 'Unknown'
    }))

    return <TrashClient data={flattenedItems || []} />
  } catch (err) {
    console.error('Unexpected error in TrashPage:', err)
    return <div>Unexpected error loading trash</div>
  }
}

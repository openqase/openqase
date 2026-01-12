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

    // Fetch deleted case studies
    const { data: deletedItems, error } = await supabase
      .from('case_studies')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('Error fetching deleted case studies:', error)
      return <div>Error loading trash: {error.message}</div>
    }

    // Fetch user emails for deleted_by users
    const userIds = [...new Set(deletedItems?.map(item => item.deleted_by).filter(Boolean) || [])]
    const userEmails: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers()
      users?.users.forEach(user => {
        if (user.id) {
          userEmails[user.id] = user.email || 'Unknown'
        }
      })
    }

    // Add deleted_by_email to each item
    const itemsWithEmails = (deletedItems || []).map(item => ({
      ...item,
      deleted_by_email: item.deleted_by ? (userEmails[item.deleted_by] || 'Unknown') : 'Unknown'
    }))

    return <TrashClient data={itemsWithEmails} />
  } catch (err) {
    console.error('Unexpected error in TrashPage:', err)
    return <div>Unexpected error loading trash</div>
  }
}

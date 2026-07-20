import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'

export type PublicHardwareSpec = {
  spec_key: string
  label: string
  value: string
  unit: string | null
}

function humanizeSpecKey(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Load spec rows for a published hardware detail page.
 * Uses service role (SSG-safe, no cookies()) — caller must only pass an id
 * for hardware already verified published + not deleted.
 */
export async function loadHardwareSpecsForDisplay(
  hardwareId: string
): Promise<PublicHardwareSpec[]> {
  const supabase = createServiceRoleSupabaseClient()

  const [specsResult, defsResult] = await Promise.all([
    supabase
      .from('quantum_hardware_specs')
      .select('spec_key, value, unit')
      .eq('hardware_id', hardwareId)
      .order('spec_key'),
    supabase.from('hardware_spec_definitions').select('spec_key, label'),
  ])

  if (specsResult.error) {
    console.error('Error loading hardware specs:', specsResult.error)
    return []
  }

  const labelByKey = new Map(
    (defsResult.data ?? []).map((def) => [def.spec_key, def.label])
  )

  return (specsResult.data ?? [])
    .map((row) => ({
      spec_key: row.spec_key,
      label: labelByKey.get(row.spec_key) ?? humanizeSpecKey(row.spec_key),
      value: row.value,
      unit: row.unit,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

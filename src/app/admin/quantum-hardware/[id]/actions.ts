'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'

type HardwareSpecDefinition =
  Database['public']['Tables']['hardware_spec_definitions']['Row']
type HardwareSpecRow = Database['public']['Tables']['quantum_hardware_specs']['Row']

export type HardwareSpecInput = {
  spec_key: string
  value: string
  unit: string | null
}

export const saveQuantumHardware = withAdmin(async (values: any) => {
  const { id, ...data } = values
  // Empty select → null for optional enum column
  if (data.technology_type === '' || data.technology_type === undefined) {
    data.technology_type = null
  }
  if (id) {
    const result = await updateContent('quantum-hardware', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('quantum-hardware', data)
  if (result.error) throw new Error(result.error)
  return result.data
})

export const publishQuantumHardware = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('quantum-hardware', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishQuantumHardware = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('quantum-hardware', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})

export const loadHardwareSpecDefinitions = withAdmin(
  async (): Promise<HardwareSpecDefinition[]> => {
    const supabase = createServiceRoleSupabaseClient()
    const { data, error } = await supabase
      .from('hardware_spec_definitions')
      .select('*')
      .order('label')

    if (error) throw new Error(error.message)
    return data ?? []
  }
)

export const loadHardwareSpecs = withAdmin(
  async (hardwareId: string): Promise<HardwareSpecRow[]> => {
    const supabase = createServiceRoleSupabaseClient()
    const { data, error } = await supabase
      .from('quantum_hardware_specs')
      .select('*')
      .eq('hardware_id', hardwareId)
      .order('spec_key')

    if (error) throw new Error(error.message)
    return data ?? []
  }
)

function normalizeSpecKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
}

export const saveHardwareSpecs = withAdmin(
  async (hardwareId: string, rows: HardwareSpecInput[]): Promise<void> => {
    const supabase = createServiceRoleSupabaseClient()
    const cleaned = rows
      .map((row) => ({
        spec_key: normalizeSpecKey(row.spec_key),
        value: row.value.trim(),
        unit: row.unit?.trim() ? row.unit.trim() : null,
      }))
      .filter((row) => row.spec_key.length > 0 && row.value.length > 0)

    const keys = cleaned.map((row) => row.spec_key)
    const seen = new Set<string>()
    for (const key of keys) {
      if (seen.has(key)) {
        throw new Error(`Duplicate spec key "${key}". Each spec key must be unique.`)
      }
      seen.add(key)
    }

    if (keys.length === 0) {
      const { error: deleteAllError } = await supabase
        .from('quantum_hardware_specs')
        .delete()
        .eq('hardware_id', hardwareId)
      if (deleteAllError) throw new Error(deleteAllError.message)
      return
    }

    const { data: existing, error: existingError } = await supabase
      .from('quantum_hardware_specs')
      .select('spec_key')
      .eq('hardware_id', hardwareId)

    if (existingError) throw new Error(existingError.message)

    const keep = new Set(keys)
    const toDelete = (existing ?? [])
      .map((row) => row.spec_key)
      .filter((key) => !keep.has(key))

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('quantum_hardware_specs')
        .delete()
        .eq('hardware_id', hardwareId)
        .in('spec_key', toDelete)
      if (deleteError) throw new Error(deleteError.message)
    }

    // verified_at is intentionally omitted from the payload: Supabase upserts
    // only the columns provided, so existing verified_at values are preserved on
    // update and left null on insert — rather than stamped to "now" on every save.
    const { error: upsertError } = await supabase.from('quantum_hardware_specs').upsert(
      cleaned.map((row) => ({
        hardware_id: hardwareId,
        spec_key: row.spec_key,
        value: row.value,
        unit: row.unit,
      })),
      { onConflict: 'hardware_id,spec_key' }
    )

    if (upsertError) throw new Error(upsertError.message)
  }
)

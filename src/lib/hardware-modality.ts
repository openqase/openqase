import { Constants, type Database } from '@/types/supabase'

export type HardwareModality = Database['public']['Enums']['hardware_modality']

export const HARDWARE_MODALITIES: HardwareModality[] = [
  ...Constants.public.Enums.hardware_modality,
]

export const HARDWARE_MODALITY_LABELS: Record<HardwareModality, string> = {
  superconducting: 'Superconducting',
  trapped_ion: 'Trapped ion',
  neutral_atom: 'Neutral atom',
  photonic: 'Photonic',
  annealer: 'Annealer',
}

export function formatHardwareModality(
  value: string | null | undefined
): string | null {
  if (!value) return null
  if (value in HARDWARE_MODALITY_LABELS) {
    return HARDWARE_MODALITY_LABELS[value as HardwareModality]
  }
  return value
}

export function isHardwareModality(value: string): value is HardwareModality {
  return (HARDWARE_MODALITIES as string[]).includes(value)
}

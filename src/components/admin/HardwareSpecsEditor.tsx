'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import type { Database } from '@/types/supabase'
import type { HardwareModality } from '@/lib/hardware-modality'
import { HARDWARE_MODALITY_LABELS } from '@/lib/hardware-modality'

type SpecDefinition = Database['public']['Tables']['hardware_spec_definitions']['Row']

export type HardwareSpecDraft = {
  /** Stable React key; not persisted. */
  clientId: string
  spec_key: string
  value: string
  unit: string | null
}

interface HardwareSpecsEditorProps {
  modality: HardwareModality | null
  definitions: SpecDefinition[]
  rows: HardwareSpecDraft[]
  onChange: (rows: HardwareSpecDraft[]) => void
  disabled?: boolean
}

function slugifyCustomKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
}

function newClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Normalize DB-loaded rows so each has a clientId. */
export function toHardwareSpecDrafts(
  rows: { spec_key: string; value: string; unit: string | null }[]
): HardwareSpecDraft[] {
  return rows.map((row) => ({
    clientId: newClientId(),
    spec_key: row.spec_key,
    value: row.value,
    unit: row.unit,
  }))
}

export function HardwareSpecsEditor({
  modality,
  definitions,
  rows,
  onChange,
  disabled = false,
}: HardwareSpecsEditorProps) {
  const definitionByKey = useMemo(() => {
    const map = new Map<string, SpecDefinition>()
    for (const def of definitions) map.set(def.spec_key, def)
    return map
  }, [definitions])

  const presetDefs = useMemo(() => {
    if (!modality) return []
    return definitions
      .filter((def) => def.modalities.includes(modality))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [definitions, modality])

  const usedKeys = useMemo(
    () => new Set(rows.map((row) => row.spec_key.toLowerCase()).filter(Boolean)),
    [rows]
  )

  const availablePresets = useMemo(
    () => presetDefs.filter((def) => !usedKeys.has(def.spec_key.toLowerCase())),
    [presetDefs, usedKeys]
  )

  const addPreset = (def: SpecDefinition) => {
    onChange([
      ...rows,
      {
        clientId: newClientId(),
        spec_key: def.spec_key,
        value: '',
        unit: def.default_unit,
      },
    ])
  }

  const addCustomRow = () => {
    onChange([
      ...rows,
      {
        clientId: newClientId(),
        spec_key: '',
        value: '',
        unit: null,
      },
    ])
  }

  const updateRow = (
    clientId: string,
    patch: Partial<Pick<HardwareSpecDraft, 'spec_key' | 'value' | 'unit'>>
  ) => {
    onChange(rows.map((row) => (row.clientId === clientId ? { ...row, ...patch } : row)))
  }

  const removeRow = (clientId: string) => {
    onChange(rows.filter((row) => row.clientId !== clientId))
  }

  if (!modality) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a technology type above to see modality-specific preset specs.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{HARDWARE_MODALITY_LABELS[modality]}</Badge>
        <span className="text-sm text-muted-foreground">
          Presets follow the technology type from Basic Information.
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label>Add preset spec</Label>
          <span className="text-xs text-muted-foreground">
            {availablePresets.length} available for {HARDWARE_MODALITY_LABELS[modality]}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availablePresets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All presets for this modality are already in the table.
            </p>
          ) : (
            availablePresets.map((def) => (
              <Button
                key={def.spec_key}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => addPreset(def)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {def.label}
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32%]">Spec</TableHead>
              <TableHead className="w-[38%]">Value</TableHead>
              <TableHead className="w-[20%]">Unit</TableHead>
              <TableHead className="w-[10%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No specs added yet. Choose a preset above or add a custom row.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const def = definitionByKey.get(row.spec_key)
                const isPreset = Boolean(def)

                return (
                  <TableRow key={row.clientId}>
                    <TableCell>
                      {isPreset ? (
                        <div className="space-y-1">
                          <p className="font-medium">{def!.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{row.spec_key}</p>
                        </div>
                      ) : (
                        <Input
                          value={row.spec_key}
                          disabled={disabled}
                          onChange={(e) => {
                            const nextKey = slugifyCustomKey(e.target.value)
                            if (definitionByKey.has(nextKey)) return
                            if (
                              rows.some(
                                (r) =>
                                  r.clientId !== row.clientId &&
                                  r.spec_key.toLowerCase() === nextKey.toLowerCase()
                              )
                            ) {
                              return
                            }
                            updateRow(row.clientId, { spec_key: nextKey })
                          }}
                          placeholder="custom_spec_key"
                          className="font-mono text-sm"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.value}
                        disabled={disabled}
                        onChange={(e) => updateRow(row.clientId, { value: e.target.value })}
                        placeholder="Enter value"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.unit ?? ''}
                        disabled={disabled}
                        onChange={(e) =>
                          updateRow(row.clientId, { unit: e.target.value || null })
                        }
                        placeholder={def?.default_unit ?? 'Unit'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() => removeRow(row.clientId)}
                        aria-label={`Remove ${row.spec_key || 'custom spec'}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={addCustomRow} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add custom spec
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PublishButton } from '@/components/admin/PublishButton'
import { ContentCompleteness } from '@/components/admin/ContentCompleteness'
import {
  HardwareSpecsEditor,
  toHardwareSpecDrafts,
  type HardwareSpecDraft,
} from '@/components/admin/HardwareSpecsEditor'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { createContentValidationRules, calculateCompletionPercentage, validateFormValues } from '@/utils/form-validation'
import {
  saveQuantumHardware,
  publishQuantumHardware,
  unpublishQuantumHardware,
  saveHardwareSpecs,
} from './actions'
import {
  HARDWARE_MODALITIES,
  HARDWARE_MODALITY_LABELS,
  isHardwareModality,
  type HardwareModality,
} from '@/lib/hardware-modality'
import type { Database } from '@/types/supabase'

type SpecDefinition = Database['public']['Tables']['hardware_spec_definitions']['Row']

type InitialSpecRow = {
  spec_key: string
  value: string
  unit: string | null
}

interface QuantumHardwareFormProps {
  quantumHardware: any
  caseStudies: any[]
  isNew: boolean
  initialSpecs: InitialSpecRow[]
  definitions: SpecDefinition[]
}

export function QuantumHardwareForm({
  quantumHardware,
  caseStudies: _caseStudies,
  isNew,
  initialSpecs,
  definitions,
}: QuantumHardwareFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    id: isNew ? undefined : quantumHardware?.id,
    name: quantumHardware?.name || '',
    slug: quantumHardware?.slug || '',
    description: quantumHardware?.description || '',
    main_content: quantumHardware?.main_content || '',
    vendor: quantumHardware?.vendor || '',
    technology_type: quantumHardware?.technology_type || '',
    qubit_count: quantumHardware?.qubit_count ?? '',
    coherence_time: quantumHardware?.coherence_time || '',
    gate_fidelity: quantumHardware?.gate_fidelity ?? '',
    connectivity: quantumHardware?.connectivity || '',
    availability: quantumHardware?.availability || '',
    access_model: quantumHardware?.access_model || '',
    website_url: quantumHardware?.website_url || '',
    documentation_url: quantumHardware?.documentation_url || '',
    published: quantumHardware?.published || false,
  })
  const [specRows, setSpecRows] = useState<HardwareSpecDraft[]>(() =>
    toHardwareSpecDrafts(initialSpecs)
  )

  const validationRules = createContentValidationRules('quantum_hardware')
  const completionPercentage = calculateCompletionPercentage({ values, validationRules })

  const modality: HardwareModality | null = isHardwareModality(values.technology_type)
    ? values.technology_type
    : null

  const handleChange = (field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from name
    if (field === 'name' && isNew) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
      setValues(prev => ({ ...prev, slug }))
    }
  }

  const persistAll = async () => {
    const result = await saveQuantumHardware({
      ...values,
      technology_type: values.technology_type || null,
    })

    const hardwareId = result?.id ?? values.id
    if (!hardwareId) {
      throw new Error('Missing hardware id after save')
    }

    await saveHardwareSpecs(hardwareId, specRows)

    return hardwareId as string
  }

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const hardwareId = await persistAll()

        if (isNew || values.id !== hardwareId) {
          setValues(prev => ({ ...prev, id: hardwareId }))
          if (isNew) {
            router.replace(`/admin/quantum-hardware/${hardwareId}`)
          }
        }
        
        toast({
          title: 'Saved',
          description: 'Quantum hardware has been saved successfully',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleSave:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save quantum hardware',
          duration: 5000,
        })
      }
    })
  }
  
  const handlePublish = async () => {
    startTransition(async () => {
      try {
        const hardwareId = await persistAll()
        setValues(prev => ({ ...prev, id: hardwareId }))
        await publishQuantumHardware(hardwareId)
        setValues(prev => ({ ...prev, published: true }))
        
        toast({
          title: 'Published',
          description: 'Quantum hardware is now published and visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handlePublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to publish quantum hardware',
          duration: 5000,
        })
      }
    })
  }
  
  const handleUnpublish = async () => {
    if (!values.id) return
    
    startTransition(async () => {
      try {
        await unpublishQuantumHardware(values.id!)
        setValues(prev => ({ ...prev, published: false }))
        
        toast({
          title: 'Unpublished',
          description: 'Quantum hardware is no longer visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleUnpublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to unpublish quantum hardware',
          duration: 5000,
        })
      }
    })
  }
  
  const validateContent = () => {
    const issues = validateFormValues({ values, validationRules })
    return Object.keys(issues).length === 0 ? true : issues
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24">
      <div className="pt-6 mb-8 bg-background pb-4 border-b border-border">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mt-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isNew ? 'Create' : 'Edit'} Quantum Hardware
              </h1>
              <p className="text-muted-foreground">
                {isNew ? 'Add a new quantum hardware system to the database.' : 'Edit quantum hardware system details.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ContentCompleteness percentage={completionPercentage} />
            <PublishButton
              isPublished={values.published}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              validateContent={validateContent}
              disabled={isPending}
            />
            <Button 
              onClick={handleSave} 
              disabled={isPending}
              className="min-w-[80px]"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-6">
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Hardware name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="url-friendly-name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={values.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="Company or organization"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="technology_type">Technology Type</Label>
                <Select
                  value={values.technology_type || undefined}
                  onValueChange={(value) => handleChange('technology_type', value)}
                >
                  <SelectTrigger id="technology_type" className="mt-1">
                    <SelectValue placeholder="Select modality" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARDWARE_MODALITIES.map((mod) => (
                      <SelectItem key={mod} value={mod}>
                        {HARDWARE_MODALITY_LABELS[mod]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="qubit_count">Qubit Count</Label>
                <Input
                  id="qubit_count"
                  value={values.qubit_count}
                  onChange={(e) => handleChange('qubit_count', e.target.value)}
                  placeholder="e.g., 100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coherence_time">Coherence Time</Label>
                <Input
                  id="coherence_time"
                  value={values.coherence_time}
                  onChange={(e) => handleChange('coherence_time', e.target.value)}
                  placeholder="e.g., 100 μs"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gate_fidelity">Gate Fidelity (%)</Label>
                <Input
                  id="gate_fidelity"
                  value={values.gate_fidelity}
                  onChange={(e) => handleChange('gate_fidelity', e.target.value)}
                  placeholder="e.g., 99.5"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="connectivity">Connectivity</Label>
                <Input
                  id="connectivity"
                  value={values.connectivity}
                  onChange={(e) => handleChange('connectivity', e.target.value)}
                  placeholder="e.g., All-to-all"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="availability">Reported Availability</Label>
                <Input
                  id="availability"
                  value={values.availability}
                  onChange={(e) => handleChange('availability', e.target.value)}
                  placeholder="e.g., IonQ Cloud"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="access_model">Access Model</Label>
                <Input
                  id="access_model"
                  value={values.access_model}
                  onChange={(e) => handleChange('access_model', e.target.value)}
                  placeholder="e.g., Cloud API"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={values.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="documentation_url">Documentation URL</Label>
                <Input
                  id="documentation_url"
                  value={values.documentation_url}
                  onChange={(e) => handleChange('documentation_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="main_content">Main Content</Label>
              <Textarea
                id="main_content"
                value={values.main_content}
                onChange={(e) => handleChange('main_content', e.target.value)}
                placeholder="Detailed content (supports markdown)"
                className="mt-1"
                rows={8}
              />
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-border">
              <Switch
                id="published"
                checked={values.published}
                onCheckedChange={(checked) => handleChange('published', checked)}
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </CardContent>
        </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-6">
          <CardTitle>Hardware Specs</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <HardwareSpecsEditor
            modality={modality}
            definitions={definitions}
            rows={specRows}
            onChange={setSpecRows}
            disabled={isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}

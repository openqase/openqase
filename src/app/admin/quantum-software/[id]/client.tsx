'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { PublishButton } from '@/components/admin/PublishButton'
import { ContentCompleteness } from '@/components/admin/ContentCompleteness'
import { ArrowLeft, Save, Loader2, Eye } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { createContentValidationRules, calculateCompletionPercentage, validateFormValues } from '@/utils/form-validation'
import { saveQuantumSoftware, publishQuantumSoftware, unpublishQuantumSoftware } from './actions'

interface QuantumSoftwareFormProps {
  quantumSoftware: any
  caseStudies: any[]
  isNew: boolean
}

export function QuantumSoftwareForm({ quantumSoftware, caseStudies, isNew }: QuantumSoftwareFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    id: isNew ? undefined : quantumSoftware?.id,
    name: quantumSoftware?.name || '',
    slug: quantumSoftware?.slug || '',
    description: quantumSoftware?.description || '',
    main_content: quantumSoftware?.main_content || '',
    vendor: quantumSoftware?.vendor || '',
    website_url: quantumSoftware?.website_url || '',
    documentation_url: quantumSoftware?.documentation_url || '',
    github_url: quantumSoftware?.github_url || '',
    license_type: quantumSoftware?.license_type || '',
    pricing_model: quantumSoftware?.pricing_model || '',
    published: quantumSoftware?.published || false,
  })

  const validationRules = createContentValidationRules('quantum_software')
  const completionPercentage = calculateCompletionPercentage({ values, validationRules })

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

    const handleSave = async () => {
    startTransition(async () => {
      try {
        const result = await saveQuantumSoftware(values)
        
        if (isNew && result?.id) {
          setValues(prev => ({ ...prev, id: result.id }))
        }
        
        toast({
          title: 'Saved',
          description: 'Quantum software has been saved successfully',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleSave:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save quantum software',
          duration: 5000,
        })
      }
    })
  }
  
  const handlePublish = async () => {
    if (!values.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot publish quantum software without saving first',
        duration: 3000,
      })
      return
    }
    
    startTransition(async () => {
      try {
        await saveQuantumSoftware(values)
        await publishQuantumSoftware(values.id!)
        
        setValues(prev => ({ ...prev, published: true }))
        
        toast({
          title: 'Published',
          description: 'Quantum software is now published and visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handlePublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to publish quantum software',
          duration: 5000,
        })
      }
    })
  }
  
  const handleUnpublish = async () => {
    if (!values.id) return
    
    startTransition(async () => {
      try {
        await unpublishQuantumSoftware(values.id!)
        setValues(prev => ({ ...prev, published: false }))
        
        toast({
          title: 'Unpublished',
          description: 'Quantum software is no longer visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleUnpublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to unpublish quantum software',
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
                {isNew ? 'Create' : 'Edit'} Quantum Software
              </h1>
              <p className="text-muted-foreground">
                {isNew ? 'Add a new quantum software platform to the database.' : 'Edit quantum software platform details.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ContentCompleteness percentage={completionPercentage} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Open preview in new tab (draft mode via /api/preview)
                const previewUrl = `/api/preview?type=quantum-software&slug=${encodeURIComponent(values.slug)}`
                window.open(previewUrl, '_blank')
              }}
              disabled={!values.id || !values.slug}
              className="min-w-[100px]"
              title={!values.id || !values.slug ? "Save the quantum software first to preview" : "Preview quantum software"}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
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
                  placeholder="Software name"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div>
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  value={values.github_url}
                  onChange={(e) => handleChange('github_url', e.target.value)}
                  placeholder="https://github.com/..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="license_type">License Type</Label>
                <Input
                  id="license_type"
                  value={values.license_type}
                  onChange={(e) => handleChange('license_type', e.target.value)}
                  placeholder="MIT, Apache, Commercial, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pricing_model">Pricing Model</Label>
                <Input
                  id="pricing_model"
                  value={values.pricing_model}
                  onChange={(e) => handleChange('pricing_model', e.target.value)}
                  placeholder="Free, Subscription, Per-use, etc."
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
    </div>
  )
}
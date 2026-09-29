'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublishButton } from '@/components/admin/PublishButton'
import { ArrowLeft, Save, Loader2, Eye } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { saveQuantumCompany, publishQuantumCompany, unpublishQuantumCompany } from './actions'

interface QuantumCompanyFormProps {
  quantumCompany: any
  caseStudies: any[]
  isNew: boolean
}

export function QuantumCompanyForm({ quantumCompany, caseStudies, isNew }: QuantumCompanyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    id: isNew ? undefined : quantumCompany?.id,
    name: quantumCompany?.name || '',
    slug: quantumCompany?.slug || '',
    description: quantumCompany?.description || '',
    main_content: quantumCompany?.main_content || '',
    company_type: quantumCompany?.company_type || '',
    founded_year: quantumCompany?.founded_year || '',
    funding_stage: quantumCompany?.funding_stage || '',
    headquarters: quantumCompany?.headquarters || '',
    website_url: quantumCompany?.website_url || '',
    linkedin_url: quantumCompany?.linkedin_url || '',
    published: quantumCompany?.published || false,
  })


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
        const result = await saveQuantumCompany(values)
        
        if (isNew && result?.id) {
          setValues(prev => ({ ...prev, id: result.id }))
        }
        
        toast({
          title: 'Saved',
          description: 'Quantum company has been saved successfully',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleSave:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save quantum company',
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
        description: 'Cannot publish quantum company without saving first',
        duration: 3000,
      })
      return
    }
    
    startTransition(async () => {
      try {
        await saveQuantumCompany(values)
        await publishQuantumCompany(values.id!)
        
        setValues(prev => ({ ...prev, published: true }))
        
        toast({
          title: 'Published',
          description: 'Quantum company is now published and visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handlePublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to publish quantum company',
          duration: 5000,
        })
      }
    })
  }
  
  const handleUnpublish = async () => {
    if (!values.id) return
    
    startTransition(async () => {
      try {
        await unpublishQuantumCompany(values.id!)
        setValues(prev => ({ ...prev, published: false }))
        
        toast({
          title: 'Unpublished',
          description: 'Quantum company is no longer visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleUnpublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to unpublish quantum company',
          duration: 5000,
        })
      }
    })
  }
  
  const validateContent = () => {
    // Basic validation - check required fields
    if (!values.name || !values.slug || !values.description) {
      return false
    }
    return true
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
                {isNew ? 'Create' : 'Edit'} Quantum Company
              </h1>
              <p className="text-muted-foreground">
                {isNew ? 'Add a new quantum company to the database.' : 'Edit quantum company details.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Open preview in new tab (draft mode via /api/preview)
                const previewUrl = `/api/preview?type=quantum-companies&slug=${encodeURIComponent(values.slug)}`
                window.open(previewUrl, '_blank')
              }}
              disabled={!values.id || !values.slug}
              className="min-w-[100px]"
              title={!values.id || !values.slug ? "Save the quantum company first to preview" : "Preview quantum company"}
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

      <div className="bg-white shadow rounded-lg">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" >Name</Label>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Company name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="slug" >Slug</Label>
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
              <Label htmlFor="description" >Description</Label>
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
                <Label htmlFor="company_type" >Company Type</Label>
                <Input
                  id="company_type"
                  value={values.company_type}
                  onChange={(e) => handleChange('company_type', e.target.value)}
                  placeholder="e.g., hardware, software, consulting, research"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="founding_year" >Founding Year</Label>
                <Input
                  id="founding_year"
                  value={values.founded_year}
                  onChange={(e) => handleChange('founded_year', e.target.value)}
                  placeholder="e.g., 2019"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="headquarters" >Headquarters</Label>
                <Input
                  id="headquarters"
                  value={values.headquarters}
                  onChange={(e) => handleChange('headquarters', e.target.value)}
                  placeholder="City, Country"
                  className="mt-1"
                />
              </div>
              <div>
              </div>
            </div>

            <div>
              <Label htmlFor="funding_stage" >Funding Stage</Label>
              <Input
                id="funding_stage"
                value={values.funding_stage}
                onChange={(e) => handleChange('funding_stage', e.target.value)}
                placeholder="e.g., Series A, Seed, Public"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="website_url" >Website URL</Label>
                <Input
                  id="website_url"
                  value={values.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="linkedin_url" >LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={values.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="main_content" >Main Content</Label>
              <Textarea
                id="main_content"
                value={values.main_content}
                onChange={(e) => handleChange('main_content', e.target.value)}
                placeholder="Detailed content (supports markdown)"
                className="mt-1"
                rows={8}
              />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
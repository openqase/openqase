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
import { savePartnerCompany, publishPartnerCompany, unpublishPartnerCompany } from './actions'

interface PartnerCompanyFormProps {
  partnerCompany: any
  caseStudies: any[]
  isNew: boolean
}

export function PartnerCompanyForm({ partnerCompany, caseStudies, isNew }: PartnerCompanyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    id: isNew ? undefined : partnerCompany?.id,
    name: partnerCompany?.name || '',
    slug: partnerCompany?.slug || '',
    description: partnerCompany?.description || '',
    main_content: partnerCompany?.main_content || '',
    industry: partnerCompany?.industry || '',
    company_size: partnerCompany?.company_size || '',
    headquarters: partnerCompany?.headquarters || '',
    partnership_type: partnerCompany?.partnership_type || '',
    quantum_initiatives: partnerCompany?.quantum_initiatives || '',
    website_url: partnerCompany?.website_url || '',
    linkedin_url: partnerCompany?.linkedin_url || '',
    published: partnerCompany?.published || false,
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
        const result = await savePartnerCompany(values)
        
        if (isNew && result?.id) {
          setValues(prev => ({ ...prev, id: result.id }))
        }
        
        toast({
          title: 'Saved',
          description: 'Partner company has been saved successfully',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleSave:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save partner company',
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
        description: 'Cannot publish partner company without saving first',
        duration: 3000,
      })
      return
    }
    
    startTransition(async () => {
      try {
        await savePartnerCompany(values)
        await publishPartnerCompany(values.id!)
        
        setValues(prev => ({ ...prev, published: true }))
        
        toast({
          title: 'Published',
          description: 'Partner company is now published and visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handlePublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to publish partner company',
          duration: 5000,
        })
      }
    })
  }
  
  const handleUnpublish = async () => {
    if (!values.id) return
    
    startTransition(async () => {
      try {
        await unpublishPartnerCompany(values.id!)
        setValues(prev => ({ ...prev, published: false }))
        
        toast({
          title: 'Unpublished',
          description: 'Partner company is no longer visible to users',
          duration: 3000,
        })
      } catch (error) {
        console.error("Error in handleUnpublish:", error)
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to unpublish partner company',
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
                {isNew ? 'Create' : 'Edit'} Partner Company
              </h1>
              <p className="text-muted-foreground">
                {isNew ? 'Add a new partner company to the database.' : 'Edit partner company details.'}
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
                const previewUrl = `/api/preview?type=partner-companies&slug=${encodeURIComponent(values.slug)}`
                window.open(previewUrl, '_blank')
              }}
              disabled={!values.id || !values.slug}
              className="min-w-[100px]"
              title={!values.id || !values.slug ? "Save the partner company first to preview" : "Preview partner company"}
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
                <Label htmlFor="industry" >Industry</Label>
                <Input
                  id="industry"
                  value={values.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder="e.g., Financial Services, Healthcare"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="company_size" >Company Size</Label>
                <Input
                  id="company_size"
                  value={values.company_size}
                  onChange={(e) => handleChange('company_size', e.target.value)}
                  placeholder="e.g., Enterprise, SME, Startup"
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
                <Label htmlFor="partnership_type" >Partnership Type</Label>
                <Input
                  id="partnership_type"
                  value={values.partnership_type}
                  onChange={(e) => handleChange('partnership_type', e.target.value)}
                  placeholder="e.g., Technology, Research, Commercial"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="quantum_initiatives" >Quantum Initiatives</Label>
              <Input
                id="quantum_initiatives"
                value={values.quantum_initiatives}
                onChange={(e) => handleChange('quantum_initiatives', e.target.value)}
                placeholder="e.g., Optimization, Simulation, Machine Learning"
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
  )
}
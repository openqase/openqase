'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelationshipSelector } from '@/components/admin/RelationshipSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContentCompleteness } from '@/components/admin/ContentCompleteness';
import { PublishButton } from '@/components/admin/PublishButton';
import { Checkbox } from '@/components/ui/checkbox';
import { TagInput } from '@/components/ui/tag-input';
import { ResourceLinksEditor } from '@/components/admin/ResourceLinksEditor';
import { createContentValidationRules, calculateCompletionPercentage, validateFormValues } from '@/utils/form-validation';
import { ArrowLeft, Save, Loader2, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { saveCaseStudy, publishCaseStudy, unpublishCaseStudy } from './actions';
import { validateContent as validateContentSpelling, type ContentIssue } from '@/lib/content-validation';
import { ContentValidationWarnings } from '@/components/admin/ContentValidationWarnings';
import { SearchReferencesModal } from '@/components/admin/SearchReferencesModal';


interface CaseStudyFormProps {
  caseStudy: any | null;
  algorithms: any[];
  industries: any[];
  personas: any[];
  quantumSoftware: any[];
  quantumHardware: any[];
  quantumCompanies: any[];
  partnerCompanies: any[];
  isNew: boolean;
}

/**
 * CaseStudyForm Component
 *
 * A simplified form for case studies with all fields on a single page.
 *
 * @param caseStudy - Initial case study data
 * @param algorithms - Available algorithms for relationships
 * @param industries - Available industries for relationships
 * @param personas - Available personas for relationships
 * @param isNew - Whether this is a new case study
 */
export function CaseStudyForm({ caseStudy, algorithms, industries, personas, quantumSoftware, quantumHardware, quantumCompanies, partnerCompanies, isNew }: CaseStudyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    id: isNew ? undefined : caseStudy?.id,
    title: isNew ? '' : caseStudy?.title || '',
    slug: isNew ? '' : caseStudy?.slug || '',
    description: isNew ? '' : caseStudy?.description || '',
    main_content: isNew ? '' : caseStudy?.main_content || '',
    // New entity relationships
    quantum_software: isNew ? [] : (caseStudy?.quantum_software || []),
    quantum_hardware: isNew ? [] : (caseStudy?.quantum_hardware || []),
    quantum_companies: isNew ? [] : (caseStudy?.quantum_companies || []),
    partner_companies: isNew ? [] : (caseStudy?.partner_companies || []),
    algorithms: isNew ? [] : (caseStudy?.algorithms || []),
    industries: isNew ? [] : (caseStudy?.industries || []),
    personas: isNew ? [] : (caseStudy?.personas || []),
    published: isNew ? false : caseStudy?.published || false,
    featured: isNew ? false : caseStudy?.featured || false,
    academic_references: isNew ? '' : caseStudy?.academic_references || '',
    resource_links: isNew ? [] : caseStudy?.resource_links || [],
    year: isNew ? new Date().getFullYear() : caseStudy?.year || new Date().getFullYear(),
  });
  const [isDirty, setIsDirty] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ContentIssue[]>([]);
  const [showSearchReferencesModal, setShowSearchReferencesModal] = useState(false);

  // Run validation whenever values change
  useEffect(() => {
    const issues = validateContentSpelling({
      title: values.title,
      description: values.description,
      main_content: values.main_content,
    });
    setValidationIssues(issues);
  }, [values.title, values.description, values.main_content]);

  // Validation rules for case studies
  const validationRules = createContentValidationRules('case_study');
  const completionPercentage = calculateCompletionPercentage({ values, validationRules });
  
  // Handle field change
  const handleChange = (field: string, value: any) => {
    const newValues = {
      ...values,
      [field]: value
    };
    
    // Auto-generate slug from title if slug is empty
    if (field === 'title' && value && !values.slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      newValues.slug = autoSlug;
    }
    
    setValues(newValues);
    setIsDirty(true);
  };
  
  // Handle adding citation numbers to references
  const handleAddCitationNumbers = () => {
    const currentText = values.academic_references;
    if (!currentText.trim()) return;
    
    const lines = currentText.split('\n');
    const processedLines: string[] = [];
    let citationNumber = 1;
    
    // First pass: find the highest existing citation number
    let maxExistingNumber = 0;
    lines.forEach((line: string) => {
      const match = line.match(/^\[\^(\d+)\]:/);
      if (match) {
        maxExistingNumber = Math.max(maxExistingNumber, parseInt(match[1]));
      }
    });
    
    // Start numbering after the highest existing number
    citationNumber = maxExistingNumber + 1;
    
    // Second pass: add numbers to lines that need them
    lines.forEach((line: string) => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') {
        processedLines.push(line); // Preserve empty lines
      } else if (trimmedLine.match(/^\[\^\d+\]:/)) {
        processedLines.push(line); // Already has citation number
      } else {
        processedLines.push(`[^${citationNumber}]: ${trimmedLine}`);
        citationNumber++;
      }
    });
    
    handleChange('academic_references', processedLines.join('\n'));
  };
  
  // Handle inserting reference templates
  const handleInsertTemplate = (type: 'journal' | 'book' | 'website') => {
    const currentText = values.academic_references;
    const templates = {
      journal: '[^X]: Author, A. Title of Article. Journal Name Year;Volume(Issue):Pages. DOI:10.xxxx/xxxxx',
      book: '[^X]: Author, A. Title of Book. Publisher; Year. ISBN:xxxxxxxxxx',
      website: '[^X]: Author, A. Title of Page. Website Name. Published Date. URL: https://example.com'
    };
    
    const template = templates[type];
    const newText = currentText ? `${currentText}\n${template}` : template;
    handleChange('academic_references', newText);
  };

  // Handle opening search references modal
  const handleSearchReferences = () => {
    setShowSearchReferencesModal(true);
  };

  // Handle references selected from modal
  const handleReferencesSelected = (references: string[]) => {
    // Get current academic_references value
    const currentRefs = values.academic_references || '';

    // Determine next citation number
    const existingNumbers = (currentRefs.match(/\[\^(\d+)\]/g) || [])
      .map((match: string) => parseInt(match.match(/\d+/)?.[0] || '0'))
      .sort((a: number, b: number) => b - a);

    let nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;

    // Format new references with citation numbers
    const formattedRefs = references.map(ref => {
      const formatted = `[^${nextNumber}]: ${ref}`;
      nextNumber++;
      return formatted;
    }).join('\n\n');

    // Append to existing references with separator
    const separator = currentRefs.trim() ? '\n\n--- Search Results ---\n\n' : '';
    const newValue = currentRefs.trim() + separator + formattedRefs;

    // Update form state
    handleChange('academic_references', newValue);

    // Show success toast
    toast({
      title: 'References Added',
      description: `Added ${references.length} reference(s) to the form`,
      duration: 3000,
    });
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    startTransition(async () => {
      const submitStartTime = Date.now();
      
      try {
        
        const result = await saveCaseStudy(values);
        
        const submitTime = Date.now() - submitStartTime;
        
        if (result?.error) {
          throw new Error(result.error);
        }
        
        if (!result?.caseStudy) {
          throw new Error('Save operation did not return case study data');
        }
        
        
        // If this was a new case study and we got an ID back, redirect to edit page
        if (isNew && result.caseStudy?.id) {
          router.push(`/admin/case-studies/${result.caseStudy.id}`);
        }
        
        setIsDirty(false);
        
        toast({
          title: 'Saved',
          description: 'Case study saved successfully',
          duration: 3000,
        });
      } catch (error: any) {
        const submitTime = Date.now() - submitStartTime;
        
        // Show specific error message if available
        const errorMessage = error?.message || 'An unknown error occurred while saving';
        
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: errorMessage,
          duration: 8000, // Longer duration for error messages
        });
      }
    });
  };
  
  // Handle publishing
  const handlePublish = async () => {
    if (!values.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot publish case study without saving first',
        duration: 3000,
      });
      return;
    }
    
    
    startTransition(async () => {
      const publishStartTime = Date.now();
      
      try {
        // First save the content
        const saveResult = await saveCaseStudy(values);
        
        if (saveResult?.error) {
          throw new Error(`Save failed: ${saveResult.error}`);
        }
        
        // Then publish it
        const publishResult = await publishCaseStudy(values.id!, values.slug);
        
        if (publishResult?.error || !publishResult?.success) {
          throw new Error(publishResult?.error || 'Publish operation failed');
        }
        
        const publishTime = Date.now() - publishStartTime;
        
        setValues(prev => ({ ...prev, published: true }));
        
        toast({
          title: 'Published',
          description: 'Case study is now published and visible to users',
          duration: 3000,
        });
      } catch (error: any) {
        const publishTime = Date.now() - publishStartTime;
        
        const errorMessage = error?.message || 'An unknown error occurred while publishing';
        
        toast({
          variant: 'destructive',
          title: 'Publish Failed',
          description: errorMessage,
          duration: 8000,
        });
      }
    });
  };
  
  // Handle unpublishing
  const handleUnpublish = async () => {
    if (!values.id) return;
    
    
    startTransition(async () => {
      const unpublishStartTime = Date.now();
      
      try {
        const result = await unpublishCaseStudy(values.id!, values.slug);
        
        if (result?.error || !result?.success) {
          throw new Error(result?.error || 'Unpublish operation failed');
        }
        
        const unpublishTime = Date.now() - unpublishStartTime;
        
        setValues(prev => ({ ...prev, published: false }));
        
        toast({
          title: 'Unpublished',
          description: 'Case study is now unpublished and hidden from users',
          duration: 3000,
        });
      } catch (error: any) {
        const unpublishTime = Date.now() - unpublishStartTime;
        
        const errorMessage = error?.message || 'An unknown error occurred while unpublishing';
        
        toast({
          variant: 'destructive',
          title: 'Unpublish Failed',
          description: errorMessage,
          duration: 8000,
        });
      }
    });
  };
  
  // Validate content before publishing
  const validateContent = () => {
    const issues = validateFormValues({
      values,
      validationRules
    });
    
    return Object.keys(issues).length === 0 ? true : issues;
  };
  
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24">
      {/* Add better spacing from the top navigation */}
      <div className="pt-6 mb-8 bg-background pb-4 border-b border-border">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/case-studies')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case Studies
          </Button>
          
          <div className="flex items-center gap-3">
            {/* Featured Checkbox - moved to left */}
            <div className="flex items-center space-x-2 p-2 border border-border rounded-md bg-card">
              <Checkbox
                id="featured"
                checked={values.featured}
                onCheckedChange={(checked: boolean) => {
                  setValues(prev => ({ ...prev, featured: checked }));
                  setIsDirty(true);
                }}
                disabled={isPending}
              />
              <Label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                Feature article
              </Label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubmit}
              disabled={isPending || !isDirty}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Open preview in new tab
                const previewUrl = `/api/preview?type=case-study&slug=${values.slug}`;
                window.open(previewUrl, '_blank');
              }}
              disabled={!values.slug}
              className="min-w-[100px]"
              title={!values.slug ? "Save the case study first to preview" : "Preview case study"}
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
              onTabChange={(tab: string) => {}}
              getTabLabel={(tab: string) => tab}
            />
          </div>
        </div>
        
        {/* Progress bar section */}
        <div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground">Content Completeness</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <ContentCompleteness percentage={completionPercentage} showLabel={false} />
        </div>
      </div>

      {/* Content Validation Warnings */}
      {validationIssues.length > 0 && (
        <ContentValidationWarnings issues={validationIssues} />
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-6">
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 pt-0">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Case study title"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="case-study-slug"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={values.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter a brief description (for SEO and previews)"
                  className="min-h-[100px]"
                />
                {/* Validation message for description can be added here if needed */}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="text"
                  value={values.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  placeholder="Enter the year of the case study"
                />
                <p className="text-sm text-muted-foreground">
                  The year when this case study was conducted or published (1990-2030)
                </p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        
        {/* Content Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-6">
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 pt-0">
            <div className="space-y-3">
              <Label htmlFor="main_content">Main Content</Label>
              <Textarea
                id="main_content"
                value={values.main_content}
                onChange={(e) => handleChange('main_content', e.target.value)}
                placeholder="Detailed content about the case study"
                rows={15}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Resource Links Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-6">
            <CardTitle>Resource Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 pt-0">
            <div className="space-y-3">
              <Label>External Resources</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Add links to external resources related to this case study, such as press releases, company websites, or project pages.
              </p>
              <ResourceLinksEditor
                links={values.resource_links}
                onChange={(newLinks) => handleChange('resource_links', newLinks)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Academic References Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-6">
            <CardTitle>Academic References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 pt-0">
            <div className="space-y-3">
              <Label htmlFor="academic_references">References</Label>
              <p className="text-sm text-muted-foreground">
                Use the format: [^1]: Reference text. Use [^1] in main content to cite.
              </p>
              
              {/* Reference Helper Buttons */}
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCitationNumbers}
                  className="text-xs"
                >
                  🔢 Add Citation Numbers
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate('journal')}
                  className="text-xs"
                >
                  📄 Journal Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate('book')}
                  className="text-xs"
                >
                  📚 Book Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertTemplate('website')}
                  className="text-xs"
                >
                  🌐 Website Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSearchReferences}
                  className="text-xs"
                >
                  🔍 Search for References
                </Button>
              </div>
              
              <Textarea
                id="academic_references"
                value={values.academic_references}
                onChange={(e) => handleChange('academic_references', e.target.value)}
                placeholder="[^1]: Author, Title, Journal (Year)"
                rows={8}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Relationships Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-6">
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-6 pt-0">
            <RelationshipSelector
              items={industries}
              selectedItems={values.industries}
              onChange={(selectedItems) => handleChange('industries', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Industries"
              placeholder="Select industries..."
              required={true}
            />
            
            <RelationshipSelector
              items={algorithms}
              selectedItems={values.algorithms}
              onChange={(selectedItems) => handleChange('algorithms', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Algorithms"
              placeholder="Select algorithms..."
              required={true}
            />
            
            <RelationshipSelector
              items={personas}
              selectedItems={values.personas}
              onChange={(selectedItems) => handleChange('personas', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Personas"
              placeholder="Select personas..."
            />
          </CardContent>
        </Card>
        
        {/* Technical Details Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-6">
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-6 pt-0">
            <RelationshipSelector
              items={quantumSoftware}
              selectedItems={values.quantum_software}
              onChange={(selectedItems) => handleChange('quantum_software', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Quantum Software"
              placeholder="Select quantum software..."
            />
            
            <RelationshipSelector
              items={quantumHardware}
              selectedItems={values.quantum_hardware}
              onChange={(selectedItems) => handleChange('quantum_hardware', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Quantum Hardware"
              placeholder="Select quantum hardware..."
            />
            
            <RelationshipSelector
              items={quantumCompanies}
              selectedItems={values.quantum_companies}
              onChange={(selectedItems) => handleChange('quantum_companies', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Quantum Companies"
              placeholder="Select quantum companies..."
            />
            
            <RelationshipSelector
              items={partnerCompanies}
              selectedItems={values.partner_companies}
              onChange={(selectedItems) => handleChange('partner_companies', selectedItems)}
              itemLabelKey="name"
              itemValueKey="id"
              label="Partner Companies"
              placeholder="Select partner companies..."
            />
          </CardContent>
        </Card>

        {/* Search References Modal */}
        <SearchReferencesModal
          open={showSearchReferencesModal}
          onOpenChange={setShowSearchReferencesModal}
          caseStudyId={caseStudy?.id || ''}
          onReferencesSelected={handleReferencesSelected}
        />
      </form>
    </div>
  );
}

export default CaseStudyForm;

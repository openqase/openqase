'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { ContentCompleteness } from './ContentCompleteness';
import { PublishButton } from './PublishButton';
import { AutoSaveTabs, TabItem } from './AutoSaveTabs';
import { 
  validateFormValues, 
  calculateCompletionPercentage,
  isTabComplete,
  ValidationRule,
  ValidationIssues
} from '@/utils/form-validation';

interface BaseContentFormProps<T extends Record<string, any>> {
  initialValues: T;
  onSave: (values: T) => Promise<void>;
  onPublish?: (values: T) => Promise<void>;
  onUnpublish?: (values: T) => Promise<void>;
  validationRules: ValidationRule[];
  tabs: Omit<TabItem, 'content'>[];
  renderTabContent: (tabValue: string, values: T, onChange: (field: keyof T, value: any) => void) => React.ReactNode;
  backUrl: string;
  isNew?: boolean;
  contentType: string;
}

/**
 * BaseContentForm Component
 * 
 * A base form component for content management with standardized functionality.
 * 
 * @param initialValues - Initial form values
 * @param onSave - Function to call when saving content
 * @param onPublish - Function to call when publishing content
 * @param onUnpublish - Function to call when unpublishing content
 * @param validationRules - Validation rules for the form
 * @param tabs - Tab configuration
 * @param renderTabContent - Function to render tab content
 * @param backUrl - URL to navigate back to
 * @param isNew - Whether this is a new content item
 * @param contentType - Type of content being edited
 */
export function BaseContentForm<T extends Record<string, any>>({
  initialValues,
  onSave,
  onPublish,
  onUnpublish,
  validationRules,
  tabs,
  renderTabContent,
  backUrl,
  isNew = false,
  contentType
}: BaseContentFormProps<T>) {
  const router = useRouter();
  const [values, setValues] = useState<T>(initialValues);
  const [activeTab, setActiveTab] = useState(tabs[0]?.value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssues>({});
  const [isDirty, setIsDirty] = useState(false);
  const completionPercentage = useMemo(
    () => calculateCompletionPercentage({ values, validationRules }),
    [values, validationRules]
  );
  
  // Handle field change
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSaving(true);
    
    try {
      await onSave(values);
      // Use a consistent date format to avoid hydration issues
      setLastSaved(typeof window !== 'undefined' ? new Date().toLocaleTimeString() : '');
      setIsDirty(false);
      
      toast({
        title: 'Saved',
        description: `${contentType} saved successfully`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error saving content:', error);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save ${contentType}`,
        duration: 5000,
      });
      
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle tab change with auto-save
  const handleTabChange = async (value: string) => {
    // Always save when changing tabs, regardless of isDirty state
    try {
      // Always save when changing tabs
      await handleSubmit();
      setActiveTab(value);
    } catch (error) {
      // Error is already handled in handleSubmit
      console.error('Error during tab change:', error);
      // Still change the tab even if save fails
      setActiveTab(value);
    }
  };
  
  // Validate content before publishing
  const validateContent = (): boolean | ValidationIssues => {
    const issues = validateFormValues({
      values,
      validationRules
    });
    
    setValidationIssues(issues);
    
    return Object.keys(issues).length === 0 ? true : issues;
  };
  
  // Handle publishing
  const handlePublish = async () => {
    if (!onPublish) return;
    
    setIsPublishing(true);
    
    try {
      // First save the content
      await handleSubmit();
      
      // Then publish it
      await onPublish(values);
      
      setValues(prev => ({ ...prev, published: true }));
      
      toast({
        title: 'Published',
        description: `${contentType} is now published and visible to users`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error publishing content:', error);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to publish ${contentType}`,
        duration: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Handle unpublishing
  const handleUnpublish = async () => {
    if (!onUnpublish) return;
    
    setIsPublishing(true);
    
    try {
      // First save the content
      await handleSubmit();
      
      // Then unpublish it
      await onUnpublish(values);
      
      setValues(prev => ({ ...prev, published: false }));
      
      toast({
        title: 'Unpublished',
        description: `${contentType} is now unpublished and hidden from users`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error unpublishing content:', error);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to unpublish ${contentType}`,
        duration: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Check if a tab is complete
  const checkTabComplete = (tabValue: string) => {
    return isTabComplete({
      values,
      validationRules,
      tabName: tabValue
    });
  };
  
  // Get tab label with completion status
  const getTabLabel = (tabValue: string) => {
    const tab = tabs.find(t => t.value === tabValue);
    return tab ? tab.label : tabValue;
  };
  
  // Prepare tabs with content
  const tabsWithContent: TabItem[] = tabs.map(tab => ({
    ...tab,
    content: renderTabContent(tab.value, values, handleChange),
    isComplete: checkTabComplete(tab.value)
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit()}
            disabled={isSaving || !isDirty}
            className="min-w-[100px]"
          >
            {isSaving ? (
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
          
          {onPublish && onUnpublish && (
            <PublishButton
              isPublished={!!values.published}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              validateContent={validateContent}
              disabled={isPublishing}
              onTabChange={setActiveTab}
              getTabLabel={getTabLabel}
            />
          )}
        </div>
      </div>
      
      <ContentCompleteness percentage={completionPercentage} />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <AutoSaveTabs
          tabs={tabsWithContent}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isTabComplete={checkTabComplete}
          isSaving={isSaving}
          lastSaved={lastSaved || undefined}
        />
      </form>
    </div>
  );
}

export default BaseContentForm;
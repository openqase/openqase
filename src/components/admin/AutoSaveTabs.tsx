'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
  isComplete?: boolean;
}

interface AutoSaveTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => Promise<void>;
  isTabComplete?: (tab: string) => boolean;
  isSaving?: boolean;
  lastSaved?: string;
  className?: string;
}

/**
 * AutoSaveTabs Component
 * 
 * A tabs component that automatically saves content when changing tabs.
 * 
 * @param tabs - Array of tab items with value, label, and content
 * @param activeTab - The currently active tab value
 * @param onTabChange - Function to call when changing tabs (should handle saving)
 * @param isTabComplete - Function to determine if a tab is complete
 * @param isSaving - Whether content is currently being saved
 * @param lastSaved - Timestamp of when content was last saved
 * @param className - Additional CSS classes
 */
export function AutoSaveTabs({
  tabs,
  activeTab,
  onTabChange,
  isTabComplete,
  isSaving = false,
  lastSaved,
  className
}: AutoSaveTabsProps) {
  const [isChangingTab, setIsChangingTab] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [prevIsSaving, setPrevIsSaving] = useState(isSaving);

  if (prevIsSaving !== isSaving) {
    setPrevIsSaving(isSaving);
    if (isSaving) {
      setSaveStatus('saving');
    } else if (saveStatus === 'saving') {
      setSaveStatus('saved');
    }
  }

  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);
  
  const handleTabChange = async (value: string) => {
    if (value === activeTab) return;
    
    setIsChangingTab(true);
    setSaveStatus('saving');
    
    try {
      await onTabChange(value);
      setSaveStatus('saved');
      
      // Reset to idle after a delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error changing tab:', error);
      setSaveStatus('idle');
    } finally {
      setIsChangingTab(false);
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full">
            {tabs.map((tab) => {
              const isComplete = tab.isComplete !== undefined
                ? tab.isComplete
                : isTabComplete
                  ? isTabComplete(tab.value)
                  : undefined;
              
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={isChangingTab}
                  className={cn(
                    'flex items-center gap-1',
                    isComplete === true && 'text-green-600',
                    isComplete === false && 'text-amber-600'
                  )}
                >
                  {tab.label}
                  {isComplete === true && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Save status indicator */}
      <div className="flex justify-end items-center h-5 text-sm text-muted-foreground">
        {saveStatus === 'saving' && (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center">
            <CheckCircle2 className="mr-2 h-3 w-3 text-green-600" />
            {lastSaved ? `Saved at ${lastSaved}` : 'Saved'}
          </div>
        )}
      </div>
    </div>
  );
}

export default AutoSaveTabs;
'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ValidationIssues } from '@/utils/form-validation';

interface ValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: ValidationIssues;
  onTabChange?: (tab: string) => void;
  getTabLabel?: (tab: string) => string;
}

/**
 * ValidationModal Component
 * 
 * Displays a modal with validation issues when trying to publish content.
 * 
 * @param open - Whether the modal is open
 * @param onOpenChange - Function to call when the open state changes
 * @param issues - Validation issues grouped by tab
 * @param onTabChange - Function to call when a tab is clicked
 * @param getTabLabel - Function to get a human-readable label for a tab
 */
export function ValidationModal({
  open,
  onOpenChange,
  issues,
  onTabChange,
  getTabLabel = (tab) => tab.charAt(0).toUpperCase() + tab.slice(1)
}: ValidationModalProps) {
  const tabsWithIssues = Object.keys(issues);
  const totalIssues = Object.values(issues).reduce(
    (count, tabIssues) => count + tabIssues.length,
    0
  );
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Cannot Publish Incomplete Content
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please fix the following {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'} before publishing:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto py-4">
          {tabsWithIssues.map((tab) => (
            <div key={tab} className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {getTabLabel(tab)}
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {issues[tab].map((issue, index) => (
                  <li key={`${tab}-${index}`} className="text-sm text-muted-foreground">
                    {issue.label}
                  </li>
                ))}
              </ul>
              {onTabChange && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    onTabChange(tab);
                    onOpenChange(false);
                  }}
                >
                  Go to {getTabLabel(tab)}
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ValidationModal;
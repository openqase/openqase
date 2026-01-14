'use client';

/**
 * Search References Modal Component
 *
 * Displays academic reference suggestions from:
 * - YAML curated foundational papers
 * - arXiv API results
 * - Semantic Scholar API results
 *
 * Allows admin to review and select which references to add to the case study.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FormattedReference {
  source: 'yaml' | 'arxiv' | 'semantic-scholar';
  text: string;
  title: string;
  authors: string;
  year: number | string;
  url: string;
}

interface SearchReferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseStudyId: string;
  onReferencesSelected: (references: string[]) => void;
}

export function SearchReferencesModal({
  open,
  onOpenChange,
  caseStudyId,
  onReferencesSelected,
}: SearchReferencesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    yaml: FormattedReference[];
    arxiv: FormattedReference[];
    semanticScholar: FormattedReference[];
  } | null>(null);
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (open && !suggestions && caseStudyId) {
      fetchSuggestions();
    }
  }, [open, caseStudyId]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/case-studies/${caseStudyId}/suggest-references`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setWarnings(data.warnings || []);

      // Show success toast with timing
      if (data.processingTime) {
        const seconds = (data.processingTime / 1000).toFixed(1);
        toast({
          title: 'References loaded',
          description: `Found suggestions in ${seconds}s`,
          duration: 2000,
        });
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch reference suggestions',
        duration: 5000,
      });

      // Close modal on complete failure
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReference = (refText: string) => {
    const newSelected = new Set(selectedRefs);
    if (newSelected.has(refText)) {
      newSelected.delete(refText);
    } else {
      newSelected.add(refText);
    }
    setSelectedRefs(newSelected);
  };

  const handleAddSelected = () => {
    if (selectedRefs.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No references selected',
        description: 'Please select at least one reference to add',
      });
      return;
    }

    onReferencesSelected(Array.from(selectedRefs));
    onOpenChange(false);

    // Reset state for next open
    setSuggestions(null);
    setSelectedRefs(new Set());
    setWarnings([]);
  };

  const handleCancel = () => {
    onOpenChange(false);

    // Reset state
    setSuggestions(null);
    setSelectedRefs(new Set());
    setWarnings([]);
  };

  const totalResults =
    (suggestions?.yaml.length || 0) +
    (suggestions?.arxiv.length || 0) +
    (suggestions?.semanticScholar.length || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search for Academic References</DialogTitle>
          <DialogDescription>
            Select references to add to this case study. References are sourced from curated
            algorithm papers and live searches of arXiv and Semantic Scholar.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Searching for references...</span>
          </div>
        )}

        {warnings.length > 0 && !isLoading && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Partial Results</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Some searches failed: {warnings.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && suggestions && totalResults === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No references found</p>
            <p className="text-sm">Try associating algorithms with this case study first.</p>
          </div>
        )}

        {!isLoading && suggestions && totalResults > 0 && (
          <div className="space-y-6">
            {/* Foundational Papers (YAML) */}
            {suggestions.yaml.length > 0 && (
              <ReferenceSection
                title="Foundational Papers"
                description="Curated foundational papers for the algorithms used in this case study"
                references={suggestions.yaml}
                selectedRefs={selectedRefs}
                onToggle={toggleReference}
              />
            )}

            {/* arXiv Results */}
            {suggestions.arxiv.length > 0 && (
              <ReferenceSection
                title="arXiv Results"
                description="Recent papers from arXiv.org"
                references={suggestions.arxiv}
                selectedRefs={selectedRefs}
                onToggle={toggleReference}
              />
            )}

            {/* Semantic Scholar Results */}
            {suggestions.semanticScholar.length > 0 && (
              <ReferenceSection
                title="Related Research"
                description="Papers from Semantic Scholar (sorted by citations)"
                references={suggestions.semanticScholar}
                selectedRefs={selectedRefs}
                onToggle={toggleReference}
              />
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedRefs.size === 0 || isLoading}
          >
            Add Selected ({selectedRefs.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for rendering reference sections
function ReferenceSection({
  title,
  description,
  references,
  selectedRefs,
  onToggle,
}: {
  title: string;
  description: string;
  references: FormattedReference[];
  selectedRefs: Set<string>;
  onToggle: (refText: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2 border rounded-md p-3 bg-muted/30 max-h-[300px] overflow-y-auto">
        {references.map((ref, idx) => (
          <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-background rounded transition-colors">
            <Checkbox
              id={`ref-${title}-${idx}`}
              checked={selectedRefs.has(ref.text)}
              onCheckedChange={() => onToggle(ref.text)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor={`ref-${title}-${idx}`}
                className="text-sm font-medium cursor-pointer leading-tight"
              >
                {ref.title}
              </Label>
              <p className="text-xs text-muted-foreground">
                {ref.authors} ({ref.year})
              </p>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-block"
                onClick={(e) => e.stopPropagation()}
              >
                View source →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

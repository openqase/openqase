'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

export type ResourceLink = {
  url: string;
  label: string;
  order: number;
};

interface ResourceLinksEditorProps {
  links: ResourceLink[];
  onChange: (links: ResourceLink[]) => void;
}

export function ResourceLinksEditor({ links, onChange }: ResourceLinksEditorProps) {
  const handleAddLink = () => {
    const newLinks = [
      ...links,
      {
        url: '',
        label: '',
        order: links.length + 1,
      },
    ];
    onChange(newLinks);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    // Recompute order values
    newLinks.forEach((link, i) => {
      link.order = i + 1;
    });
    onChange(newLinks);
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === links.length - 1)
    ) {
      return;
    }

    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap items
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];

    // Update order values
    newLinks.forEach((link, i) => {
      link.order = i + 1;
    });

    onChange(newLinks);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index].url = value;
    onChange(newLinks);
  };

  const handleLabelChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index].label = value;
    onChange(newLinks);
  };

  return (
    <div className="space-y-4">
      {links.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">
          No resource links added yet. Add your first link below.
        </div>
      ) : (
        links.map((link, index) => (
          <div
            key={index}
            className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center border p-3 rounded-md"
          >
            <div className="font-medium text-muted-foreground">{index + 1}</div>
            
            <div>
              <Label htmlFor={`resource-label-${index}`} className="text-xs mb-1 block">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`resource-label-${index}`}
                value={link.label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder="e.g. Company Website"
                required
                aria-required="true"
                className={!link.label.trim() ? 'border-destructive' : ''}
              />
              {!link.label.trim() && (
                <p className="text-xs text-destructive mt-1">Label is required</p>
              )}
            </div>
            
            <div>
              <Label htmlFor={`resource-url-${index}`} className="text-xs mb-1 block">
                URL
              </Label>
              <Input
                id={`resource-url-${index}`}
                value={link.url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://..."
              />
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={index === 0}
                onClick={() => handleMoveLink(index, 'up')}
                title="Move Up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={index === links.length - 1}
                onClick={() => handleMoveLink(index, 'down')}
                title="Move Down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveLink(index)}
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                title="Remove Link"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
      
      <Button
        type="button"
        variant="outline"
        onClick={handleAddLink}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Resource Link
      </Button>
    </div>
  );
}

export default ResourceLinksEditor; 
"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command } from "@/components/ui/command"
import { cn } from "@/lib/utils"

export type TagInputProps = {
  placeholder?: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
  className?: string
}

export function TagInput({
  placeholder = "Add item...",
  tags,
  onTagsChange,
  disabled = false,
  className,
}: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = React.useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = inputValue.trim()
    
    // When Enter or comma is pressed, add the tag
    if ((e.key === "Enter" || e.key === ",") && value !== "") {
      e.preventDefault()
      
      // Don't add if tag already exists
      if (!tags.includes(value)) {
        onTagsChange([...tags, value])
      }
      
      setInputValue("")
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Delete the last tag when backspace is pressed with empty input
      onTagsChange(tags.slice(0, -1))
    }
  }

  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag))
  }

  return (
    <Command className={cn("overflow-visible bg-transparent", className)}>
      <div className="flex flex-wrap gap-1 rounded-md border-2 border-input bg-surface-sunken px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-ring">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
            <button
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => handleRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-32"
        />
      </div>
    </Command>
  )
} 
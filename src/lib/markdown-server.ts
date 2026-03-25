import { cache } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'isomorphic-dompurify';

// Create a singleton instance of MarkdownIt with the same configuration used across all pages
let mdInstance: MarkdownIt | null = null;

function getMarkdownInstance() {
  if (!mdInstance) {
    mdInstance = new MarkdownIt({
      html: true,        // INTENTIONAL: See security note above
      linkify: true,
      typographer: true,
      breaks: true
    });

    // Customize renderer to improve table formatting
    const defaultTableOpen = mdInstance.renderer.rules.table_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

    mdInstance.renderer.rules.table_open = function(tokens, idx, options, env, self) {
      return '<div class="table-container">' + defaultTableOpen(tokens, idx, options, env, self);
    };

    mdInstance.renderer.rules.table_close = function() {
      return '</table></div>';
    };

    // Customize cell rendering for numeric detection
    const defaultCellRender = mdInstance.renderer.rules.td_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

    mdInstance.renderer.rules.td_open = function(tokens, idx, options, env, self) {
      const content = tokens[idx+1]?.content;
      const isNumeric = content && !isNaN(parseFloat(content)) && content.trim() !== '';
      
      if (isNumeric) {
        return '<td class="numeric">';
      }
      return defaultCellRender(tokens, idx, options, env, self);
    };
  }
  
  return mdInstance;
}

// Function to fix bullet points in markdown content (consistent across all pages)
function preprocessMarkdown(content: string): string {
  // Fix lists: ensure there's a space after each dash at the beginning of a line
  // and add a newline before lists if needed
  const fixedContent = content
    .replace(/^-([^\s])/gm, '- $1')  // Add space after dash at line start if missing
    .replace(/([^\n])\n^-\s/gm, '$1\n\n- '); // Add blank line before list starts
    
  return fixedContent;
}

/**
 * Server-side cached markdown processor
 * This function is cached using React's cache() to avoid reprocessing the same content
 * during build time or server rendering
 */
export const processMarkdown = cache((content: string | null | undefined): string => {
  if (!content) return '';
  
  const md = getMarkdownInstance();
  const preprocessedContent = preprocessMarkdown(content);
  const rawHtml = md.render(preprocessedContent);
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'rel', 'class', 'id', 'allowfullscreen', 'frameborder', 'src'],
    ALLOW_DATA_ATTR: false,
  });
});

/**
 * Export preprocessMarkdown for components that need custom processing
 */
export { preprocessMarkdown };
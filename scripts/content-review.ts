#!/usr/bin/env npx tsx
/**
 * Content Review Tool for UK English
 * Checks all database content for spelling and grammar issues
 * Uses LanguageTool API with custom quantum computing dictionary
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

// LanguageTool API configuration
const LANGUAGE_TOOL_API = 'https://api.languagetoolplus.com/v2/check';
const LANGUAGE = 'en-GB'; // British English

// Custom dictionary for quantum computing terms
const QUANTUM_TERMS = [
  'qubit', 'qubits', 'superposition', 'entanglement', 'decoherence',
  'quantum', 'Grover', 'Shor', 'QAOA', 'VQE', 'QPU', 'QKD',
  'Hadamard', 'Pauli', 'Bloch', 'Dirac', 'Hamiltonian',
  'eigenstate', 'eigenvector', 'eigenvalue', 'unitarity',
  'annealing', 'annealer', 'transpilation', 'transpiler',
  'variational', 'parametrized', 'parametrised', 'ansatz',
  'OpenQase', 'Qiskit', 'Cirq', 'PennyLane', 'Q#',
  'IonQ', 'Rigetti', 'D-Wave', 'NISQ', 'supremacy',
  'teleportation', 'cryptography', 'blockchain', 'optimization',
  'optimisation', 'minimisation', 'minimization', 'maximisation'
];

// Common US to UK spelling patterns to specifically check
const US_TO_UK_PATTERNS = [
  { pattern: /optimize/gi, suggestion: 'optimise' },
  { pattern: /optimization/gi, suggestion: 'optimisation' },
  { pattern: /minimize/gi, suggestion: 'minimise' },
  { pattern: /maximize/gi, suggestion: 'maximise' },
  { pattern: /analyze/gi, suggestion: 'analyse' },
  { pattern: /realize/gi, suggestion: 'realise' },
  { pattern: /organize/gi, suggestion: 'organise' },
  { pattern: /recognize/gi, suggestion: 'recognise' },
  { pattern: /color/gi, suggestion: 'colour' },
  { pattern: /behavior/gi, suggestion: 'behaviour' },
  { pattern: /center/gi, suggestion: 'centre' },
  { pattern: /fiber/gi, suggestion: 'fibre' },
  { pattern: /defense/gi, suggestion: 'defence' },
  { pattern: /license/gi, suggestion: 'licence' },
  { pattern: /catalog/gi, suggestion: 'catalogue' },
  { pattern: /dialog/gi, suggestion: 'dialogue' },
  { pattern: /traveling/gi, suggestion: 'travelling' },
  { pattern: /modeling/gi, suggestion: 'modelling' },
  { pattern: /signaling/gi, suggestion: 'signalling' },
];

interface ContentIssue {
  table: string;
  id: string;
  title?: string;
  field: string;
  type: 'spelling' | 'grammar' | 'style' | 'us-spelling';
  message: string;
  found: string;
  suggestions: string[];
  context: string;
  offset: number;
  length: number;
  rule?: string;
}

interface ContentReviewReport {
  timestamp: string;
  totalIssues: number;
  byType: Record<string, number>;
  byTable: Record<string, number>;
  issues: ContentIssue[];
  usSpellings: ContentIssue[];
  stats: {
    tablesChecked: number;
    itemsChecked: number;
    fieldsChecked: number;
  };
}

interface LanguageToolMatch {
  offset: number;
  length: number;
  message: string;
  rule?: { id?: string; issueType?: string };
  replacements?: Array<{ value: string }>;
  context?: { text?: string };
}

interface LanguageToolResponse {
  matches?: LanguageToolMatch[];
}

class ContentReviewer {
  private supabase: SupabaseClient;
  private issues: ContentIssue[] = [];
  private usSpellings: ContentIssue[] = [];
  private stats = {
    tablesChecked: 0,
    itemsChecked: 0,
    fieldsChecked: 0,
  };

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check text using LanguageTool API
   */
  async checkWithLanguageTool(text: string): Promise<LanguageToolResponse | null> {
    const params = new URLSearchParams({
      text: text,
      language: LANGUAGE,
      enabledOnly: 'false',
      // Disable rules for quantum computing terms
      disabledRules: 'MORFOLOGIK_RULE_EN_GB,HUNSPELL_RULE',
    });

    try {
      const response = await fetch(LANGUAGE_TOOL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.error('LanguageTool API error:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling LanguageTool:', error);
      return null;
    }
  }

  /**
   * Check for US spelling patterns
   */
  checkUSSpellings(text: string): Array<{pattern: string, matches: string[]}> {
    const findings: Array<{pattern: string, matches: string[]}> = [];
    
    for (const check of US_TO_UK_PATTERNS) {
      const matches = text.match(check.pattern);
      if (matches && matches.length > 0) {
        // Filter out quantum terms that might be acceptable
        const filtered = matches.filter(m => 
          !QUANTUM_TERMS.some(term => 
            term.toLowerCase() === m.toLowerCase()
          )
        );
        
        if (filtered.length > 0) {
          findings.push({
            pattern: check.suggestion,
            matches: [...new Set(filtered)] // Unique matches
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Process LanguageTool results and filter out false positives
   */
  processLanguageToolResults(
    result: LanguageToolResponse | null,
    text: string,
    table: string,
    id: string,
    title: string,
    field: string
  ): void {
    if (!result || !result.matches) return;

    for (const match of result.matches) {
      // Skip if it's a known quantum term
      const matchedText = text.substring(match.offset, match.offset + match.length);
      if (QUANTUM_TERMS.some(term => 
        term.toLowerCase() === matchedText.toLowerCase()
      )) {
        continue;
      }

      // Skip certain rule types that are often false positives
      if (match.rule?.id?.includes('WHITESPACE') || 
          match.rule?.id?.includes('PUNCTUATION')) {
        continue;
      }

      const issue: ContentIssue = {
        table,
        id,
        title,
        field,
        type: match.rule?.issueType === 'misspelling' ? 'spelling' : 
              match.rule?.issueType === 'grammar' ? 'grammar' : 'style',
        message: match.message,
        found: matchedText,
        suggestions: match.replacements?.map(r => r.value) || [],
        context: match.context?.text || '',
        offset: match.offset,
        length: match.length,
        rule: match.rule?.id,
      };

      this.issues.push(issue);
    }
  }

  /**
   * Check a single content item
   */
  async checkContent(
    table: string,
    item: Record<string, unknown>,
    fields: string[]
  ): Promise<void> {
    const title = String(item.title || item.name || `ID: ${item.id}`);
    
    for (const field of fields) {
      if (!item[field]) continue;
      
      this.stats.fieldsChecked++;
      const text = String(item[field]);
      
      // Check for US spellings
      const usSpellings = this.checkUSSpellings(text);
      for (const spelling of usSpellings) {
        this.usSpellings.push({
          table,
          id: String(item.id),
          title,
          field,
          type: 'us-spelling',
          message: `US spelling detected. Consider using UK spelling: ${spelling.pattern}`,
          found: spelling.matches.join(', '),
          suggestions: [spelling.pattern],
          context: '',
          offset: 0,
          length: 0,
        });
      }
      
      // Check with LanguageTool (limit text length to avoid API limits)
      const maxLength = 10000; // LanguageTool limit
      const textToCheck = text.length > maxLength 
        ? text.substring(0, maxLength) + '...[truncated]'
        : text;
      
      const result = await this.checkWithLanguageTool(textToCheck);
      this.processLanguageToolResults(result, textToCheck, table, String(item.id), title, field);
      
      // Rate limiting to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Check all content in a table
   */
  async checkTable(
    tableName: string,
    fields: string[]
  ): Promise<void> {
    console.log(chalk.blue(`\nChecking ${tableName}...`));
    
    const { data, error } = await this.supabase
      .from(tableName)
      .select('*')
      .eq('published', true);
    
    if (error) {
      console.error(chalk.red(`Error fetching ${tableName}:`, error));
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(chalk.gray(`No published content in ${tableName}`));
      return;
    }
    
    this.stats.tablesChecked++;
    console.log(chalk.gray(`Found ${data.length} items to check`));
    
    for (const item of data) {
      this.stats.itemsChecked++;
      await this.checkContent(tableName, item, fields);
      process.stdout.write('.');
    }
    
    console.log(chalk.green(' Done!'));
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report: ContentReviewReport): Promise<string> {
    const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Review Report - ${report.timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 1rem; }
    h2 { color: #1e40af; margin: 2rem 0 1rem; padding-top: 1rem; border-top: 2px solid #e5e5e5; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .stat-card { background: #f9fafb; padding: 1rem; border-radius: 4px; border-left: 4px solid #3b82f6; }
    .stat-card h3 { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
    .stat-card .value { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
    .issue { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 1rem; margin: 1rem 0; }
    .issue.us-spelling { background: #fef3c7; border-color: #fbbf24; }
    .issue.grammar { background: #ede9fe; border-color: #a78bfa; }
    .issue-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem; }
    .issue-title { font-weight: bold; color: #1f2937; }
    .issue-type { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .type-spelling { background: #ef4444; color: white; }
    .type-us-spelling { background: #f59e0b; color: white; }
    .type-grammar { background: #8b5cf6; color: white; }
    .type-style { background: #3b82f6; color: white; }
    .issue-details { color: #4b5563; font-size: 0.875rem; margin: 0.5rem 0; }
    .issue-message { margin: 0.5rem 0; padding: 0.5rem; background: white; border-radius: 4px; }
    .suggestions { margin-top: 0.5rem; }
    .suggestion { display: inline-block; padding: 0.25rem 0.5rem; margin: 0.25rem; background: #10b981; color: white; border-radius: 4px; font-size: 0.875rem; }
    .context { margin-top: 0.5rem; padding: 0.5rem; background: #f3f4f6; border-radius: 4px; font-family: monospace; font-size: 0.875rem; }
    .summary { background: #ecfdf5; border: 1px solid #86efac; border-radius: 4px; padding: 1rem; margin: 1rem 0; }
    .no-issues { color: #10b981; font-weight: bold; font-size: 1.25rem; text-align: center; padding: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f9fafb; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📝 Content Review Report</h1>
    <p>Generated: ${report.timestamp}</p>
    
    <div class="stats">
      <div class="stat-card">
        <h3>Total Issues</h3>
        <div class="value">${report.totalIssues}</div>
      </div>
      <div class="stat-card">
        <h3>Tables Checked</h3>
        <div class="value">${report.stats.tablesChecked}</div>
      </div>
      <div class="stat-card">
        <h3>Items Checked</h3>
        <div class="value">${report.stats.itemsChecked}</div>
      </div>
      <div class="stat-card">
        <h3>Fields Checked</h3>
        <div class="value">${report.stats.fieldsChecked}</div>
      </div>
    </div>
    
    ${report.totalIssues === 0 ? '<div class="no-issues">✅ No issues found!</div>' : ''}
    
    ${report.usSpellings.length > 0 ? `
      <h2>🇺🇸 US Spelling Detected (${report.usSpellings.length})</h2>
      <div class="summary">
        <p>The following US spellings were found. Consider using UK English equivalents:</p>
      </div>
      ${report.usSpellings.map(issue => `
        <div class="issue us-spelling">
          <div class="issue-header">
            <div class="issue-title">${issue.table} - ${issue.title}</div>
            <span class="issue-type type-us-spelling">US Spelling</span>
          </div>
          <div class="issue-details">Field: ${issue.field}</div>
          <div class="issue-message">${issue.message}</div>
          <div class="issue-details">Found: <strong>${issue.found}</strong></div>
          ${issue.suggestions.length > 0 ? `
            <div class="suggestions">
              Suggestion: ${issue.suggestions.map(s => `<span class="suggestion">${s}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    ` : ''}
    
    ${report.issues.length > 0 ? `
      <h2>📖 Grammar & Spelling Issues (${report.issues.length})</h2>
      ${report.issues.map(issue => `
        <div class="issue ${issue.type}">
          <div class="issue-header">
            <div class="issue-title">${issue.table} - ${issue.title}</div>
            <span class="issue-type type-${issue.type}">${issue.type}</span>
          </div>
          <div class="issue-details">Field: ${issue.field}</div>
          <div class="issue-message">${issue.message}</div>
          <div class="issue-details">Found: <strong>"${issue.found}"</strong></div>
          ${issue.suggestions.length > 0 ? `
            <div class="suggestions">
              Suggestions: ${issue.suggestions.slice(0, 3).map(s => `<span class="suggestion">${s}</span>`).join('')}
            </div>
          ` : ''}
          ${issue.context ? `<div class="context">${issue.context}</div>` : ''}
        </div>
      `).join('')}
    ` : ''}
    
    <h2>📊 Issue Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>US Spellings</td>
          <td>${report.usSpellings.length}</td>
        </tr>
        <tr>
          <td>Spelling Errors</td>
          <td>${report.byType['spelling'] || 0}</td>
        </tr>
        <tr>
          <td>Grammar Issues</td>
          <td>${report.byType['grammar'] || 0}</td>
        </tr>
        <tr>
          <td>Style Suggestions</td>
          <td>${report.byType['style'] || 0}</td>
        </tr>
      </tbody>
    </table>
    
    <h2>📁 Issues by Table</h2>
    <table>
      <thead>
        <tr>
          <th>Table</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(report.byTable).map(([table, count]) => `
          <tr>
            <td>${table}</td>
            <td>${count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
    
    return html;
  }

  /**
   * Run the complete review
   */
  async runReview(): Promise<void> {
    console.log(chalk.bold.blue('\n🔍 OpenQase Content Review Tool'));
    console.log(chalk.gray('Checking for UK English spelling and grammar...\n'));
    
    // Define tables and fields to check
    const contentTables = [
      { name: 'case_studies', fields: ['title', 'description', 'main_content'] },
      { name: 'blog_posts', fields: ['title', 'description', 'content'] },
      { name: 'algorithms', fields: ['name', 'description', 'main_content'] },
      { name: 'industries', fields: ['name', 'description', 'main_content'] },
      { name: 'personas', fields: ['name', 'description', 'main_content', 'recommended_reading'] },
      { name: 'quantum_software', fields: ['name', 'description', 'main_content'] },
      { name: 'quantum_hardware', fields: ['name', 'description', 'main_content'] },
      { name: 'quantum_companies', fields: ['name', 'description', 'main_content'] },
      { name: 'partner_companies', fields: ['name', 'description', 'main_content'] },
    ];
    
    // Check each table
    for (const table of contentTables) {
      await this.checkTable(table.name, table.fields);
    }
    
    // Generate report
    const report: ContentReviewReport = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length + this.usSpellings.length,
      byType: this.issues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTable: [...this.issues, ...this.usSpellings].reduce((acc, issue) => {
        acc[issue.table] = (acc[issue.table] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      issues: this.issues,
      usSpellings: this.usSpellings,
      stats: this.stats,
    };
    
    // Save HTML report
    const htmlReport = await this.generateHTMLReport(report);
    const reportPath = path.join(process.cwd(), 'content-review-report.html');
    await fs.writeFile(reportPath, htmlReport);
    
    // Save JSON report for programmatic use
    const jsonPath = path.join(process.cwd(), 'content-review-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log(chalk.bold.green('\n✅ Review Complete!\n'));
    console.log(chalk.white('Summary:'));
    console.log(chalk.gray(`• Total issues found: ${chalk.yellow(report.totalIssues)}`));
    console.log(chalk.gray(`• US spellings: ${chalk.yellow(report.usSpellings.length)}`));
    console.log(chalk.gray(`• Grammar/spelling issues: ${chalk.yellow(report.issues.length)}`));
    console.log(chalk.gray(`• Tables checked: ${report.stats.tablesChecked}`));
    console.log(chalk.gray(`• Items checked: ${report.stats.itemsChecked}`));
    console.log(chalk.gray(`• Fields checked: ${report.stats.fieldsChecked}`));
    
    console.log(chalk.bold.blue('\n📄 Reports saved:'));
    console.log(chalk.gray(`• HTML: ${reportPath}`));
    console.log(chalk.gray(`• JSON: ${jsonPath}`));
    
    if (report.totalIssues > 0) {
      console.log(chalk.yellow('\n⚠️  Issues found. Open the HTML report for details.'));
    } else {
      console.log(chalk.green('\n🎉 No issues found! Your content is looking good.'));
    }
  }
}

// Run the review
async function main() {
  try {
    const reviewer = new ContentReviewer();
    await reviewer.runReview();
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export type { ContentReviewReport };
export { ContentReviewer };
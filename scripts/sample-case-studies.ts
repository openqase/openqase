#!/usr/bin/env npx tsx
/**
 * One-off sampling script: pull 5 random published case studies and analyse
 * their main_content markdown for embedded patterns relevant to a future
 * block-based content model migration.
 *
 * Output: per-study summary + aggregate pattern counts.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/david/Github/openqase/.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) {
  console.error('Missing env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

interface Patterns {
  headings_h1: number;
  headings_h2: number;
  headings_h3: number;
  bullets: number;
  numbered: number;
  fenced_code: number;
  inline_code: number;
  blockquotes: number;
  hr: number;
  links_internal: number;   // /paths/, /case-study/, /algorithm/, etc.
  links_external: number;
  images: number;
  bold: number;
  italic: number;
  footnotes_marked: number; // [^1] or similar
  tables: number;
  html_iframe: number;
  html_img: number;
  html_other: number;
  superscript_refs: number; // ^[1] or similar
  bracketed_refs: number;   // [1], [Smith 2020]
  arxiv_links: number;      // arxiv.org links
  doi_links: number;        // doi.org links
  word_count: number;
  char_count: number;
}

function analyse(md: string): Patterns {
  const p: Patterns = {
    headings_h1: 0, headings_h2: 0, headings_h3: 0,
    bullets: 0, numbered: 0,
    fenced_code: 0, inline_code: 0,
    blockquotes: 0, hr: 0,
    links_internal: 0, links_external: 0, images: 0,
    bold: 0, italic: 0,
    footnotes_marked: 0, tables: 0,
    html_iframe: 0, html_img: 0, html_other: 0,
    superscript_refs: 0, bracketed_refs: 0,
    arxiv_links: 0, doi_links: 0,
    word_count: 0, char_count: 0,
  };
  if (!md) return p;
  p.char_count = md.length;
  p.word_count = (md.match(/\S+/g) || []).length;

  for (const line of md.split('\n')) {
    if (/^# /.test(line)) p.headings_h1++;
    else if (/^## /.test(line)) p.headings_h2++;
    else if (/^### /.test(line)) p.headings_h3++;
    if (/^\s*[-*+] /.test(line)) p.bullets++;
    if (/^\s*\d+\. /.test(line)) p.numbered++;
    if (/^\s*>/.test(line)) p.blockquotes++;
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) p.hr++;
  }
  p.fenced_code = (md.match(/```/g) || []).length / 2;
  p.inline_code = (md.match(/`[^`\n]+`/g) || []).length;
  p.images = (md.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const allLinks = md.match(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g) || [];
  for (const l of allLinks) {
    const m = l.match(/\(([^)]+)\)/);
    if (!m) continue;
    const href = m[1];
    if (/^\/(paths|case-study|algorithm|industry|persona|blog|quantum)/.test(href)) p.links_internal++;
    else if (/^https?:/.test(href)) {
      p.links_external++;
      if (/arxiv\.org/.test(href)) p.arxiv_links++;
      if (/doi\.org/.test(href)) p.doi_links++;
    }
  }
  p.bold = (md.match(/\*\*[^*\n]+\*\*/g) || []).length + (md.match(/__[^_\n]+__/g) || []).length;
  p.italic = (md.match(/(?<!\*)\*[^*\n]+\*(?!\*)/g) || []).length;
  p.footnotes_marked = (md.match(/\[\^[^\]]+\]/g) || []).length;
  p.superscript_refs = (md.match(/\^\[[^\]]+\]/g) || []).length;
  p.bracketed_refs = (md.match(/\[\d+\]/g) || []).length;
  // tables: count separator lines like |---|---|
  p.tables = (md.match(/^\s*\|[-:\s|]+\|\s*$/gm) || []).length;
  p.html_iframe = (md.match(/<iframe\b/gi) || []).length;
  p.html_img = (md.match(/<img\b/gi) || []).length;
  p.html_other = (md.match(/<(?!\/?(iframe|img)\b)[a-z][^>]*>/gi) || []).length;
  return p;
}

async function sampleTable(table: string, contentField: string, sampleSize: number) {
  const fields = ['id', 'slug', contentField].join(', ');
  const { data, error } = await supabase
    .from(table)
    .select(fields)
    .eq('published', true)
    .not(contentField, 'is', null);
  if (error) { console.error(`[${table}.${contentField}]`, error.message); return; }
  if (!data || data.length === 0) { console.log(`[${table}.${contentField}] no rows`); return; }
  console.log(`\n========== ${table}.${contentField} (total: ${data.length}) ==========`);
  const sample = [...data].sort(() => Math.random() - 0.5).slice(0, sampleSize);
  const aggregate: any = {};
  for (const row of sample) {
    const r = row as any;
    const md = r[contentField] as string;
    const p = analyse(md);
    console.log(`\n--- ${r.slug} ---`);
    console.log(`words: ${p.word_count}  chars: ${p.char_count}`);
    const filtered = Object.fromEntries(Object.entries(p).filter(([k,v]) =>
      typeof v === 'number' && (v as number) > 0 && k !== 'word_count' && k !== 'char_count'
    ));
    console.log(filtered);
    console.log('  preview:', md.slice(0, 350).replace(/\n/g, '\\n'));
  }
  console.log('\n--- aggregate ---');
  console.log(aggregate || {});
  for (const row of sample) {
    const md = (row as any)[contentField] as string;
    const p = analyse(md);
    for (const [k, v] of Object.entries(p)) aggregate[k] = (aggregate[k] || 0) + (v as number);
  }
  console.log(aggregate);
}

async function main() {
  await sampleTable('case_studies', 'main_content', 5);
  await sampleTable('case_studies', 'academic_references', 5);
  await sampleTable('algorithms', 'main_content', 3);
  await sampleTable('algorithms', 'technical_details', 3);
  await sampleTable('algorithms', 'academic_references', 3);
  await sampleTable('blog_posts', 'main_content', 3);
  await sampleTable('industries', 'main_content', 2);
  await sampleTable('personas', 'main_content', 2);
}

main().catch(e => { console.error(e); process.exit(1); });

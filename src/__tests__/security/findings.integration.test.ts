import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET as caseStudiesGET } from '@/app/api/case-studies/route';
import { NextRequest } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { fromTable } from '@/lib/internal-queries';

describe('Finding 1.1 — Public GET API leaks unpublished/soft-deleted content', () => {
  const seededIds: string[] = [];

  beforeAll(async () => {
    const sb = createServiceRoleSupabaseClient();
    const draft = await fromTable(sb, 'case_studies')
      .insert({
        slug: 'test-draft-a1',
        title: 'A1 draft fixture',
        published: false,
        description: 'fixture',
        main_content: 'draft body',
        deleted_at: null,
      })
      .select('id')
      .single();
    if (draft.data?.id) seededIds.push(draft.data.id);
    const pub = await fromTable(sb, 'case_studies')
      .insert({
        slug: 'test-published-a1',
        title: 'A1 published fixture',
        published: true,
        description: 'fixture',
        main_content: 'published body',
        deleted_at: null,
      })
      .select('id')
      .single();
    if (pub.data?.id) seededIds.push(pub.data.id);
  });

  afterAll(async () => {
    const sb = createServiceRoleSupabaseClient();
    for (const id of seededIds) {
      await fromTable(sb, 'case_studies').delete().eq('id', id);
    }
  });

  it('returns 404 (or null) for an unpublished case study slug via the public API', async () => {
    const url = 'http://localhost:3000/api/case-studies?slug=test-draft-a1';
    const req = new NextRequest(url, { method: 'GET' });
    const res = await caseStudiesGET(req);
    if (res.status === 200) {
      const body = await res.json();
      expect(body).not.toHaveProperty('main_content');
      expect(body).not.toHaveProperty('id');
    } else {
      expect(res.status).toBe(404);
    }
  });

  it('returns the record for a published case study slug', async () => {
    const url = 'http://localhost:3000/api/case-studies?slug=test-published-a1';
    const req = new NextRequest(url, { method: 'GET' });
    const res = await caseStudiesGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('slug', 'test-published-a1');
  });
});

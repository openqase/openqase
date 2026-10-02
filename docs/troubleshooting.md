# OpenQase Troubleshooting Guide

Comprehensive solutions for common issues in OpenQase development and deployment.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Supabase Connection Issues](#supabase-connection-issues)
- [Build and Deployment Errors](#build-and-deployment-errors)
- [Database Migration Problems](#database-migration-problems)
- [Authentication Issues](#authentication-issues)
- [Performance Troubleshooting](#performance-troubleshooting)
- [Redis and Caching Issues](#redis-and-caching-issues)
- [Rate Limiting Problems](#rate-limiting-problems)
- [Environment Variables](#environment-variables)
- [Development Environment](#development-environment)
- [Common Error Messages](#common-error-messages)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

Before diving into specific issues, run these quick checks:

### Health Check Commands

```bash
# Check Node.js version (should be 20+)
node --version

# Check npm version
npm --version

# Verify dependencies are installed
npm list --depth=0

# Check Supabase status (local development)
supabase status

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check environment variables
npm run env:check  # If you have this script
```

### Common Quick Fixes

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset local Supabase
supabase stop
supabase start

# Clear Redis cache (development only)
# Use the flush method in your code or Redis CLI
```

---

## Supabase Connection Issues

### Issue: "Failed to fetch" or Connection Timeout

**Symptoms:**
- API routes return 500 errors
- Database queries hang or timeout
- Console shows connection errors

**Solutions:**

1. **Verify Environment Variables**

```bash
# Check these are set correctly
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

2. **Check Supabase Project Status**

Visit your Supabase dashboard and verify:
- Project is not paused (free tier auto-pauses after 7 days inactivity)
- Database is running
- No ongoing maintenance

3. **Test Connection Directly**

```typescript
// Create a test file: test-supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConnection() {
  const { data, error } = await supabase
    .from('case_studies')
    .select('count')
    .limit(1);

  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful:', data);
  }
}

testConnection();
```

4. **Check Network/Firewall**

```bash
# Test connectivity to Supabase
curl -I https://your-project.supabase.co

# Check if port 5432 is accessible (if using direct Postgres)
nc -zv your-project.supabase.co 5432
```

### Issue: "Invalid API Key" or "JWT expired"

**Solutions:**

1. **Regenerate API Keys**

Go to Supabase Dashboard → Settings → API and copy fresh keys.

2. **Check for Trailing Spaces**

```bash
# Remove any whitespace from .env.local
sed -i '' 's/[[:space:]]*$//' .env.local
```

3. **Verify Service Role Key Usage**

Service role key should ONLY be used server-side:
- ✅ API routes (`src/app/api/**/route.ts`)
- ✅ Server Actions
- ❌ Client components
- ❌ Browser code

### Issue: Row Level Security (RLS) Blocking Queries

**Symptoms:**
- Queries return empty results
- Error: "new row violates row-level security policy"

**Solutions:**

1. **Check RLS Policies**

```sql
-- View policies for a table
SELECT * FROM pg_policies WHERE tablename = 'case_studies';

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE case_studies DISABLE ROW LEVEL SECURITY;
```

2. **Verify Authentication Context**

```typescript
// In API routes, ensure you're using authenticated client
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return new Response('Unauthorized', { status: 401 });
}
```

3. **Check Admin Role**

```sql
-- Verify user has admin role
SELECT * FROM user_preferences WHERE user_id = 'your-user-id';
```

---

## Build and Deployment Errors

### Issue: "Module not found" During Build

**Solutions:**

1. **Clear Build Cache**

```bash
rm -rf .next
npm run build
```

2. **Check Import Paths**

Ensure you're using the correct path alias:

```typescript
// ✅ Correct
import { Button } from '@/components/ui/button';

// ❌ Incorrect
import { Button } from '../../components/ui/button';
```

3. **Verify TypeScript Configuration**

Check `tsconfig.json` has correct paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "Type Error" During Build

**Solutions:**

1. **Run Type Check Locally**

```bash
npx tsc --noEmit
```

2. **Check for Strict Null Checks**

```typescript
// ❌ Might fail strict null checks
const title = data.title.toUpperCase();

// ✅ Safe null handling
const title = data.title?.toUpperCase() ?? 'Untitled';
```

3. **Regenerate Supabase Types**

```bash
supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

### Issue: Build Timeout on Vercel

**Symptoms:**
- Build exceeds 15-minute limit
- Out of memory errors

**Solutions:**

1. **Enable Output File Tracing**

Already configured in `next.config.js`:

```javascript
module.exports = {
  output: 'standalone', // Reduces bundle size
  // ...
};
```

2. **Optimize Static Generation**

```typescript
// Reduce concurrent static page generation
export const dynamic = 'force-static';
export const revalidate = 3600; // Cache for 1 hour
```

3. **Increase Vercel Timeout** (Pro plan only)

```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "maxDuration": 900
      }
    }
  ]
}
```

### Issue: Environment Variables Not Available

**Solutions:**

1. **Check Variable Naming**

```bash
# ✅ Client-side variables MUST start with NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=https://...

# ✅ Server-only variables (no prefix)
SUPABASE_SERVICE_ROLE_KEY=...
```

2. **Verify in Vercel Dashboard**

Settings → Environment Variables → Add all variables from `.env.local`

3. **Redeploy After Adding Variables**

Vercel requires redeployment for new environment variables to take effect.

---

## Database Migration Problems

### Issue: Migration Fails to Apply

**Symptoms:**
- `supabase db push` fails
- Error: "relation already exists"

**Solutions:**

1. **Check Migration Order**

```bash
# List migrations
ls supabase/migrations/

# Migrations should be numbered chronologically
# 20240101000000_initial.sql
# 20240102000000_add_feature.sql
```

2. **Reset Local Database** (DESTROYS DATA)

```bash
supabase db reset
```

3. **Apply Migrations Manually**

```bash
# Connect to database
supabase db connect

# Run migration SQL manually
\i supabase/migrations/your_migration.sql
```

### Issue: Production Migration Out of Sync

**Solutions:**

1. **Check Applied Migrations**

```sql
SELECT * FROM supabase_migrations.schema_migrations;
```

2. **Generate Diff Migration**

```bash
# Pull current production schema
supabase db pull

# Generate migration for differences
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_sync.sql
```

3. **Manual Migration Application**

For production, use Supabase Dashboard → SQL Editor:

```sql
-- Apply your migration SQL here
-- Be VERY careful with production data!
```

### Issue: Data Loss After Migration

**Prevention:**

1. **Always Backup Before Migration**

```bash
# Local backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Supabase backup (automatic, but verify)
# Dashboard → Database → Backups
```

2. **Test Migrations Locally First**

```bash
# Apply to local DB
supabase db reset
supabase db push

# Test thoroughly before production
npm run dev
```

3. **Use Transactions in Migrations**

```sql
BEGIN;

-- Your migration statements here
ALTER TABLE case_studies ADD COLUMN new_field TEXT;

-- Verify changes
SELECT COUNT(*) FROM case_studies;

-- If something looks wrong, you can ROLLBACK
COMMIT;
```

---

## Authentication Issues

### Issue: User Can't Sign In

**Solutions:**

1. **Check Email Confirmation**

Supabase requires email confirmation by default. Check:
- Dashboard → Authentication → Settings → Enable email confirmations

For development, disable confirmations:
```sql
-- In Supabase SQL Editor
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'test@example.com';
```

2. **Verify Auth Provider**

Dashboard → Authentication → Providers → Ensure Email is enabled

3. **Check Session Cookie**

```typescript
// In browser console
document.cookie.split(';').forEach(c => console.log(c));
// Look for sb-access-token
```

### Issue: "Admin Access Required" Error

**Solutions:**

1. **Verify Admin Role**

```sql
-- Check user_preferences table
SELECT * FROM user_preferences WHERE user_id = 'your-user-id';

-- If no row exists, insert one
INSERT INTO user_preferences (user_id, role)
VALUES ('your-user-id', 'admin');
```

2. **Run Setup Script**

```bash
tsx scripts/setup-admin.ts
```

3. **Check Admin Middleware**

File: `src/lib/admin-check.ts`

Ensure it's correctly checking the role:

```typescript
const isAdmin = userPrefs?.role === 'admin';
```

### Issue: Session Expires Too Quickly

**Solutions:**

1. **Increase Session Duration**

Dashboard → Authentication → Settings → JWT expiry: 604800 (7 days)

2. **Implement Token Refresh**

Already implemented in `src/lib/supabase/client.ts`:

```typescript
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true, // Auto-refresh tokens
      persistSession: true,
    },
  }
);
```

### Issue: CORS Errors on Auth

**Solutions:**

1. **Add Site URL to Supabase**

Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/auth/callback`

2. **Check Middleware**

Ensure `proxy.ts` allows auth routes:

```typescript
export const config = {
  matcher: [
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Performance Troubleshooting

### Issue: Slow Page Load Times

**Diagnostics:**

1. **Check Next.js Build Output**

```bash
npm run build

# Look for:
# ƒ  Function - Server-side renders at runtime (too many is bad)
# ○  Static - Automatically rendered as static HTML
# ●  SSG - Static Site Generation
```

2. **Analyze Bundle Size**

```bash
ANALYZE=true npm run build

# Opens webpack bundle analyzer
# Look for large chunks or duplicate dependencies
```

**Solutions:**

1. **Reduce Database Calls**

Use unified content fetching (already implemented):

```typescript
// ✅ Single query with relations
const caseStudy = await getCaseStudyBySlug(slug);

// ❌ Multiple queries (N+1 problem)
const caseStudy = await getCaseStudy(slug);
const algorithms = await getAlgorithms(caseStudy.id); // DON'T DO THIS
```

2. **Implement Static Generation**

```typescript
// For content pages
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  const caseStudies = await getAllCaseStudySlugs();
  return caseStudies.map((slug) => ({ slug }));
}
```

3. **Enable Redis Caching**

```bash
# Add to .env.local
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Issue: High Memory Usage

**Solutions:**

1. **Limit Concurrent Builds**

```javascript
// next.config.js
module.exports = {
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};
```

2. **Optimize Images**

Already using next/image, but ensure:

```typescript
<Image
  src={imageUrl}
  alt="..."
  width={800}
  height={600}
  quality={75} // Reduce if too high
/>
```

3. **Reduce Page Size**

```typescript
// Paginate large lists
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 20; // Limit results

  const { data, count } = await supabase
    .from('case_studies')
    .select('*', { count: 'exact' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  return Response.json({ items: data, total: count });
}
```

### Issue: Slow Database Queries

**Diagnostics:**

```sql
-- Enable query timing
\timing

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solutions:**

1. **Add Indexes**

```sql
-- Check missing indexes
CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies(slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies(published);

-- For relationship tables
CREATE INDEX IF NOT EXISTS idx_cs_algorithms_case_study ON case_study_algorithms(case_study_id);
CREATE INDEX IF NOT EXISTS idx_cs_algorithms_algorithm ON case_study_algorithms(algorithm_id);
```

2. **Optimize Queries**

```typescript
// ❌ Select all columns
const { data } = await supabase.from('case_studies').select('*');

// ✅ Select only needed columns
const { data } = await supabase
  .from('case_studies')
  .select('id, title, slug, published');
```

3. **Use Connection Pooling**

Already configured via Supabase, but for custom Postgres:

```javascript
// Use pgBouncer or connection pooling
const connectionString = process.env.DATABASE_URL + '?pgbouncer=true';
```

---

## Redis and Caching Issues

### Issue: Redis Cache Not Working

**Diagnostics:**

```bash
# Check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Check Redis connection in logs
npm run dev
# Look for: "✅ Redis cache initialized" or "ℹ️ Redis credentials not found"
```

**Solutions:**

1. **Verify Upstash Configuration**

- Create account at https://upstash.com
- Create Redis database
- Copy REST URL and token to .env.local

2. **Test Connection Directly**

```typescript
// Create test file: test-redis.ts
import { redisCache } from '@/lib/cache-redis';

async function testRedis() {
  const isEnabled = redisCache.isEnabled();
  console.log('Redis enabled:', isEnabled);

  if (isEnabled) {
    await redisCache.set('test-key', { message: 'Hello' }, 60);
    const value = await redisCache.get('test-key');
    console.log('Retrieved value:', value);
  }
}

testRedis();
```

3. **Check for Network/Firewall Issues**

```bash
# Test Upstash endpoint
curl -I https://your-redis.upstash.io
```

### Issue: Stale Cache Data

**Solutions:**

1. **Manual Cache Invalidation**

```typescript
import { cache } from '@/lib/cache';

// After updating data
await cache.delete(`case-study:${slug}`);

// Or delete pattern
await cache.deletePattern('case-study:*');
```

2. **Implement Cache Invalidation in API Routes**

```typescript
// src/app/api/case-studies/route.ts
export async function POST(request: Request) {
  // ... save case study ...

  // Invalidate cache
  await cache.delete(`case-study:${slug}`);
  await cache.deletePattern('case-studies:list:*');

  return Response.json({ success: true });
}
```

3. **Reduce TTL for Frequently Changing Data**

```typescript
import { CACHE_TTL } from '@/lib/cache-redis';

// Use shorter TTL for dynamic content
await cache.set(key, data, CACHE_TTL.SHORT); // 1 minute

// Use longer TTL for static content
await cache.set(key, data, CACHE_TTL.DAY); // 24 hours
```

### Issue: Cache Eating Too Much Memory (In-Memory Fallback)

**Solutions:**

1. **Reduce LRU Cache Size**

Edit `src/lib/cache.ts`:

```typescript
class InMemoryCache {
  private maxSize = 500; // Reduce from 1000
  // ...
}
```

2. **Clear Cache on Deployment**

```bash
# In deployment script
npm run build
# Cache is automatically cleared on restart
```

---

## Rate Limiting Problems

### Issue: "Too Many Requests" Error

**Solutions:**

1. **Check Rate Limit Configuration**

```bash
# Current limits (from environment variables)
echo $RATE_LIMIT_GENERAL # Default: 100 requests / 15 minutes
echo $RATE_LIMIT_NEWSLETTER # Default: 5 requests / 5 minutes
```

2. **Adjust Limits for Development**

```bash
# .env.local
RATE_LIMIT_GENERAL=1000
RATE_LIMIT_GENERAL_WINDOW=900000
```

3. **Clear Rate Limit**

```typescript
// In Redis
await redisCache.delete('ratelimit:your-ip-address');
```

### Issue: Rate Limiter Not Working

**Solutions:**

1. **Check Redis Connection**

Rate limiter requires Redis in production. If Redis is unavailable, it falls back to in-memory (single server only).

2. **Verify Environment Variables**

```bash
# Required for Redis rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

3. **Test Rate Limiter Directly**

```typescript
import { rateLimiter } from '@/lib/rate-limiter';

async function testRateLimiter() {
  const result = await rateLimiter.checkLimit(
    '127.0.0.1',
    5,
    60000 // 5 requests per minute
  );

  console.log('Allowed:', result.allowed);
  console.log('Remaining:', result.remaining);
}
```

---

## Environment Variables

### Issue: Variables Not Loading

**Solutions:**

1. **Check File Name**

Must be exactly:
- `.env.local` (for local development)
- `.env.production` (for production)
- NOT `.env` (not read by Next.js by default)

2. **Restart Dev Server**

```bash
# Kill all node processes
pkill -9 node

# Restart
npm run dev
```

3. **Verify in Code**

```typescript
// Add debug logging
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

### Issue: Variables Work Locally but Not in Production

**Solutions:**

1. **Add to Vercel Dashboard**

Settings → Environment Variables → Add each variable

2. **Redeploy**

Vercel requires redeployment after adding variables.

3. **Check Variable Scope**

- Production
- Preview
- Development

Ensure variables are enabled for the correct scope.

### Issue: "Cannot read property of undefined"

**Solutions:**

1. **Add Type Safety**

```typescript
// ❌ Unsafe
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ✅ Safe with validation
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}
```

2. **Create Environment Validation**

```typescript
// src/lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export function validateEnv() {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
```

---

## Development Environment

### Issue: Port Already in Use

**Solutions:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: Hot Reload Not Working

**Solutions:**

1. **Check File Watchers Limit** (Linux/Mac)

```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. **Clear Next.js Cache**

```bash
rm -rf .next
npm run dev
```

3. **Check for File System Issues**

```bash
# Mac: Check if using NFS/network drive (slow)
df -h

# Use local disk for best performance
```

### Issue: TypeScript Errors in Editor vs CLI

**Solutions:**

1. **Restart TypeScript Server**

VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

2. **Check tsconfig.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    // Should match your editor settings
  }
}
```

3. **Regenerate Types**

```bash
# Regenerate Supabase types
supabase gen types typescript --project-id your-project-id > src/types/supabase.ts

# Clear TypeScript cache
rm -rf node_modules/.cache
```

---

## Common Error Messages

### "Error: ENOSPC: System limit for number of file watchers reached"

**Solution:**

```bash
# Linux
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Mac
# Usually not an issue, but check if using Docker
docker system prune -a
```

### "Module not found: Can't resolve '@/...'"

**Solutions:**

1. Check `tsconfig.json` has paths configured
2. Restart TypeScript server
3. Clear `.next` directory

### "Invalid hook call" (React Error)

**Solutions:**

1. **Check for Multiple React Versions**

```bash
npm ls react
# Should only show one version

# If multiple, dedupe
npm dedupe react
```

2. **Ensure 'use client' Directive**

```typescript
// Must be at the very top
'use client';

import { useState } from 'react';
```

### "Hydration failed" (Next.js Error)

**Solutions:**

1. **Check for Server/Client Mismatches**

```typescript
// ❌ Will cause hydration error
<div>{new Date().toString()}</div>

// ✅ Use client-only rendering
'use client';
import { useEffect, useState } from 'react';

export function TimeDisplay() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toString());
  }, []);

  return <div>{time}</div>;
}
```

2. **Verify HTML Structure**

```typescript
// ❌ <p> cannot contain <div>
<p><div>Content</div></p>

// ✅ Correct nesting
<div><p>Content</p></div>
```

### "CORS Error" in Browser

**Solutions:**

1. **Check API Route Configuration**

```typescript
// src/app/api/[endpoint]/route.ts
export async function GET(request: Request) {
  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}
```

2. **Add OPTIONS Handler**

```typescript
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

---

## Getting Help

### Before Asking for Help

1. **Check Console Errors**

Browser console (F12) and terminal output often contain the exact error message and stack trace.

2. **Review Recent Changes**

```bash
# What changed recently?
git diff HEAD~1

# What was the last working commit?
git log --oneline -10
```

3. **Search Existing Issues**

Check GitHub issues for similar problems:
https://github.com/openqase/openqase/issues

### How to Report Issues

**Provide this information:**

1. **Environment**
   - OS and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - OpenQase version

2. **Steps to Reproduce**
   ```
   1. Run `npm run dev`
   2. Navigate to /admin/case-studies
   3. Click "Create New"
   4. Error appears
   ```

3. **Error Messages**
   - Full error from terminal
   - Browser console errors
   - Network tab (for API errors)

4. **Expected vs Actual Behavior**

5. **Relevant Code** (if applicable)

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community help
- **Documentation**: https://github.com/openqase/openqase/tree/main/docs

### Debugging Tips

1. **Add Debug Logging**

```typescript
// Add console.logs strategically
console.log('1. Function called with:', params);
const result = await fetchData();
console.log('2. Fetch result:', result);
```

2. **Use TypeScript Strictly**

```typescript
// Enable strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

3. **Bisect to Find Regression**

```bash
# Find which commit introduced the bug
git bisect start
git bisect bad  # Current commit is bad
git bisect good v0.5.0  # This version was good

# Git will checkout middle commit, test it
npm install
npm run build

# Mark as good or bad
git bisect good  # or git bisect bad

# Repeat until you find the problematic commit
```

---

## Quick Reference

### Health Check Checklist

- [ ] Node.js 20+ installed
- [ ] `.env.local` file exists with all required variables
- [ ] Supabase project is active (not paused)
- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts without errors
- [ ] Database migrations applied
- [ ] Admin user created via setup script
- [ ] Can access http://localhost:3000
- [ ] Can sign in to /auth

### Performance Checklist

- [ ] Build output shows mostly static pages (○ or ●)
- [ ] No N+1 queries (use unified content fetching)
- [ ] Redis caching enabled for production
- [ ] Images optimized with next/image
- [ ] Database indexes exist on frequently queried columns
- [ ] Rate limiting configured
- [ ] Bundle size < 1MB (check with ANALYZE=true)

### Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key only used server-side
- [ ] Environment variables not exposed to client
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SQL injection prevented (using Supabase client, not raw SQL)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF tokens if needed (Next.js handles this)

---

**Last Updated:** January 2026
**Version:** 0.5.0
**Next Review:** With v0.6.0 release (February 2026)

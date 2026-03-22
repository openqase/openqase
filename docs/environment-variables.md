# Environment Variables Guide

Complete reference for all environment variables used in OpenQase.

## Quick Start

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your values
# Required: Supabase credentials
# Optional: Newsletter, email, monitoring services
```

## Configuration File

Create a `.env.local` file in the project root. This file is git-ignored and contains your local/production secrets.

## Required Variables

### Supabase Database

These are **required** for the application to function.

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Required**: Yes
- **Type**: String (URL)
- **Default**: None
- **Description**: Your Supabase project URL
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Example**:
  - Local: `http://127.0.0.1:54321`
  - Production: `https://xxxxxxxxxxxx.supabase.co`
- **Security**: Public (safe to expose to browser)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Required**: Yes
- **Type**: String (JWT)
- **Default**: None
- **Description**: Supabase anonymous/public API key (RLS-protected)
- **Where to find**: Supabase Dashboard → Settings → API → anon public
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Security**: Public (safe to expose - protected by RLS policies)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Required**: Yes (for admin functions and server-side operations)
- **Type**: String (JWT)
- **Default**: None
- **Description**: Supabase service role key (bypasses RLS - server-side only)
- **Where to find**: Supabase Dashboard → Settings → API → service_role secret
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Security**: ⚠️ **CRITICAL** - Never expose to browser, server-side only
- **Usage**: Admin operations, database migrations, scripts

---

## Optional Variables

### Site Configuration

#### `NEXT_PUBLIC_SITE_URL`
- **Required**: No
- **Type**: String (URL)
- **Default**: `https://openqase.com`
- **Description**: Base URL for your deployment (used for SEO canonical URLs, email links, sitemap generation)
- **Example**:
  - Local: `http://localhost:3000`
  - Staging: `https://staging.openqase.com`
  - Production: `https://openqase.com`
- **Security**: Public
- **When to set**: Different for each environment

#### `DEV_MODE_AUTH_BYPASS`
- **Required**: No
- **Type**: Boolean string
- **Default**: `false`
- **Description**: Bypass authentication checks on localhost (development only)
- **Example**: `true` or `false`
- **Security**: ⚠️ Must be `false` in production
- **Usage**: Set to `true` for local development to skip auth on admin routes

---

### Newsletter Integration

#### `BEEHIIV_API_KEY`
- **Required**: No (required if using Beehiiv)
- **Type**: String
- **Default**: None
- **Description**: API key for Beehiiv newsletter service
- **Where to find**: Beehiiv Dashboard → Settings → API
- **Example**: `sk_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Security**: Private - server-side only
- **Usage**: Newsletter subscriptions, email campaigns

#### `BEEHIIV_PUBLICATION_ID`
- **Required**: No (required if using Beehiiv)
- **Type**: String
- **Default**: None
- **Description**: Your Beehiiv publication identifier
- **Where to find**: Beehiiv Dashboard → Settings → Publication ID
- **Example**: `pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Security**: Private - server-side only
- **Usage**: Newsletter subscription management

---

### Transactional Email

#### `RESEND_API_KEY`
- **Required**: No (required if using Resend)
- **Type**: String
- **Default**: None
- **Description**: API key for Resend email service
- **Where to find**: Resend Dashboard → API Keys
- **Example**: `re_xxxxxxxxxxxxxxxxxxxx`
- **Security**: Private - server-side only
- **Usage**: Transactional emails, notifications, backups for newsletter

---

### Error Tracking & Monitoring

#### `SENTRY_DSN`
- **Required**: No (required if using Sentry)
- **Type**: String (URL)
- **Default**: None
- **Description**: Sentry Data Source Name for server-side error tracking
- **Where to find**: Sentry Dashboard → Settings → Client Keys (DSN)
- **Example**: `https://xxxxxxxxxxxxxxxx@o4509319185367040.ingest.us.sentry.io/4509319185367040`
- **Security**: Public (contains public key only)
- **Usage**: Server-side error tracking, performance monitoring

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Required**: No (required if using Sentry)
- **Type**: String (URL)
- **Default**: None
- **Description**: Sentry DSN for client-side error tracking
- **Where to find**: Sentry Dashboard → Settings → Client Keys (DSN)
- **Example**: Same as `SENTRY_DSN`
- **Security**: Public
- **Usage**: Browser error tracking, performance monitoring

#### `NEXT_PUBLIC_SENTRY_PROJECT_ID`
- **Required**: No
- **Type**: String
- **Default**: None
- **Description**: Sentry project identifier
- **Where to find**: Sentry Dashboard → Settings → General Settings
- **Example**: `4509319185367040`
- **Security**: Public
- **Usage**: Linking to Sentry issues page

---

### Preview & Development

#### `PREVIEW_SECRET`
- **Required**: No
- **Type**: String
- **Default**: `preview-secret-key`
- **Description**: Secret token for Next.js preview mode (draft content viewing)
- **Example**: `my-super-secret-preview-token-12345`
- **Security**: Private - keep secret
- **Usage**: Preview unpublished content at `/api/preview?secret=YOUR_SECRET&slug=content-slug`

---

### Rate Limiting

#### `RATE_LIMIT_NEWSLETTER`
- **Required**: No
- **Type**: Number (integer)
- **Default**: `5`
- **Description**: Maximum newsletter subscription requests per window
- **Example**: `5`
- **Security**: Configuration only
- **Usage**: Prevent newsletter spam/abuse

#### `RATE_LIMIT_NEWSLETTER_WINDOW`
- **Required**: No
- **Type**: Number (milliseconds)
- **Default**: `300000` (5 minutes)
- **Description**: Time window for newsletter rate limiting
- **Example**: `300000` (5 minutes)
- **Security**: Configuration only

#### `RATE_LIMIT_GENERAL`
- **Required**: No
- **Type**: Number (integer)
- **Default**: `100`
- **Description**: Maximum general API requests per window
- **Example**: `100`
- **Security**: Configuration only
- **Usage**: General API rate limiting

#### `RATE_LIMIT_GENERAL_WINDOW`
- **Required**: No
- **Type**: Number (milliseconds)
- **Default**: `900000` (15 minutes)
- **Description**: Time window for general rate limiting
- **Example**: `900000` (15 minutes)
- **Security**: Configuration only

---

### Build & Deployment

#### `NEXT_STATIC_EXPORT`
- **Required**: No
- **Type**: Boolean string
- **Default**: `false`
- **Description**: Enable fully static export (no server-side features)
- **Example**: `true` or `false`
- **Security**: Configuration only
- **Usage**: Set to `true` for static hosting (GitHub Pages, S3, etc.)
- **Note**: Disables API routes and server-side features

---

### Script-Only Variables

These are only used by admin setup scripts, not at runtime.

#### `ADMIN_EMAIL`
- **Required**: No (required for setup script)
- **Type**: String (email)
- **Default**: None
- **Description**: Email for initial admin user creation
- **Example**: `admin@openqase.com`
- **Security**: Private
- **Usage**: `npm run setup-admin` script only

#### `ADMIN_PASSWORD`
- **Required**: No (required for setup script)
- **Type**: String
- **Default**: None
- **Description**: Password for initial admin user creation
- **Example**: `secure-password-123`
- **Security**: Private - delete after setup
- **Usage**: `npm run setup-admin` script only
- **Note**: Can be removed from `.env.local` after initial setup

---

## Automatic Variables

These are set automatically by Next.js or the environment.

#### `NODE_ENV`
- **Set by**: Next.js automatically
- **Values**: `development`, `production`, `test`
- **Description**: Current environment mode
- **Usage**: Environment-specific behavior, error handling

#### `NEXT_RUNTIME`
- **Set by**: Next.js automatically
- **Values**: `nodejs`, `edge`
- **Description**: Runtime environment for the current code
- **Usage**: Runtime-specific configuration (Sentry, middleware)

#### `CI`
- **Set by**: CI/CD platforms automatically
- **Values**: `true` or undefined
- **Description**: Indicates running in CI environment
- **Usage**: CI-specific logging and behavior

---

## Environment-Specific Configurations

### Local Development

```bash
# .env.local (local development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DEV_MODE_AUTH_BYPASS=true
```

### Staging

```bash
# .env.local (staging)
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
NEXT_PUBLIC_SITE_URL=https://staging.openqase.com
DEV_MODE_AUTH_BYPASS=false

# Optional services for testing
BEEHIIV_API_KEY=sk_test_...
RESEND_API_KEY=re_test_...
SENTRY_DSN=https://...@sentry.io/...
```

### Production

```bash
# Production environment variables (set in Vercel/hosting platform)
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
NEXT_PUBLIC_SITE_URL=https://openqase.com
DEV_MODE_AUTH_BYPASS=false

# Production services
BEEHIIV_API_KEY=sk_live_...
BEEHIIV_PUBLICATION_ID=pub_...
RESEND_API_KEY=re_live_...
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
PREVIEW_SECRET=very-secure-random-string

# Production rate limiting (optional - more restrictive)
RATE_LIMIT_NEWSLETTER=3
RATE_LIMIT_NEWSLETTER_WINDOW=600000
RATE_LIMIT_GENERAL=50
RATE_LIMIT_GENERAL_WINDOW=900000
```

---

## Security Best Practices

### ✅ DO

- **Keep `.env.local` git-ignored** - Never commit secrets to version control
- **Use different keys per environment** - Don't reuse production keys in development
- **Rotate keys regularly** - Especially service role keys and API keys
- **Use environment variables in hosting platforms** - Vercel, Netlify, etc. have secure env var management
- **Set `DEV_MODE_AUTH_BYPASS=false`** in production - Never bypass auth in production

### ❌ DON'T

- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the browser - Server-side only
- **Never commit API keys** to git - Use `.env.local` which is git-ignored
- **Don't use weak secrets** - Use strong, random strings for `PREVIEW_SECRET`
- **Don't share production credentials** - Keep them secure and separate

---

## Vercel Deployment

Set environment variables in Vercel Dashboard → Settings → Environment Variables:

1. **Production**: Set all production values
2. **Preview**: Use staging/test API keys
3. **Development**: Can use local values (optional)

### Vercel-Specific Notes

- Prefix with `NEXT_PUBLIC_` for browser-accessible variables
- Redeploy after changing environment variables
- Use Vercel's encrypted storage for secrets
- Environment variables are available during build and runtime

---

## Troubleshooting

### Common Issues

**Issue**: "Supabase client creation failed"
- **Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

**Issue**: "Service role key not found"
- **Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set (server-side only)

**Issue**: "Auth not working on localhost"
- **Solution**: Set `DEV_MODE_AUTH_BYPASS=true` for local development

**Issue**: "Newsletter subscription failing"
- **Solution**: Check `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` are set

**Issue**: "Emails not sending"
- **Solution**: Verify `RESEND_API_KEY` is set and valid

**Issue**: "Sentry errors not appearing"
- **Solution**: Check both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are set

### Validation Script

Run this to check your environment variables:

```bash
# Check if all required vars are set
npx tsx scripts/check-env.ts
```

### Debug Environment Variables

```typescript
// Add to any server component temporarily
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has service key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL || 'not set')
```

---

## Related Documentation

- [Supabase Configuration](./installation.md#supabase-setup)
- [Deployment Guide](./deployment.md)
- [Email System](./email-system.md)
- [Authentication](./authentication.md)

---

**Last Updated**: January 2026
**Next Review**: With v0.6.0 release (February 2026)

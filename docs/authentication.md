# Authentication

Authentication and authorization are handled using a combination of Next.js Middleware, Supabase Auth, and helper utilities.

## Core Mechanism: Next.js Middleware

*   **File:** `src/middleware.ts`
*   **Functionality:** This middleware intercepts requests to specific routes defined in its `config.matcher` array before they reach the page or API handler.
*   **Session Management:** It utilizes the `updateSession` helper (imported from `@/lib/supabase-middleware`) which likely uses the `@supabase/ssr` package to manage user sessions securely across Server Components, Client Components, and Route Handlers by handling cookies.

## Route Protection

The middleware defines different levels of protection:

1.  **General Protected Routes:**
    *   Defined in the `protectedRoutes` array (e.g., `/paths`, `/case-study`, `/profile`).
    *   The `updateSession` helper (from `@supabase/ssr`) automatically handles redirecting unauthenticated users accessing these routes, typically sending them to a login page (e.g., `/auth`).

2.  **Admin Routes:**
    *   Defined in the `adminRoutes` array (`/admin`).
    *   **Requires Authentication:** Users must first be logged in. If not, they are redirected to `/auth?redirectTo=/admin`.
    *   **Requires 'admin' Role:** After confirming authentication, the middleware specifically checks if the logged-in user has the `admin` role.
        *   It fetches the user's session using a server-side Supabase client (`createServerSupabaseClient` from `@/lib/supabase`).
        *   It queries the `user_preferences` table in Supabase, filtering by the user's ID (`session.user.id`).
        *   It checks if the `role` column in `user_preferences` is equal to `'admin'`.
        *   If the user is not found in `user_preferences` or their role is not `'admin'`, they are redirected to the homepage (`/`).

## Authentication UI

*   User interface components for login, signup, password reset, etc., are likely located within the `src/app/auth/` directory.
*   These pages probably utilize Supabase UI components (`@supabase/auth-ui-react`) or custom forms that interact with Supabase Auth client methods (`supabase.auth.signInWithPassword`, `supabase.auth.signUp`, etc.).
*   The `/auth/callback` route is specifically handled by the middleware to process the redirect after successful authentication via third-party providers or email links.

## Supabase Auth Integration

*   The application relies heavily on [Supabase Authentication](https://supabase.com/docs/guides/auth).
*   User identities, sessions, and potentially user metadata are stored and managed within Supabase.
*   Different Supabase client helpers (`supabase-browser`, `supabase-server`, `supabase-middleware`) are likely used depending on the context (Client Component, Server Component, Middleware) to interact with Supabase Auth. See the [Supabase Integration](./supabase-integration.md) guide for more details on client usage.

# Authentication & Authorization

OpenQase uses Supabase Auth for user authentication with a two-tier security architecture.

## Architecture Overview

### Two-Tier Security Model

OpenQase implements a **dual security approach** that separates admin operations from public API access:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Routes  │ -> │   Service Role   │ -> │  Bypass All RLS │
│   /admin/*      │    │   Client         │    │  Full Access    │
└─────────────────┘    └──────────────────┘    └─────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Public Routes  │ -> │  Regular Client  │ -> │   RLS Policies  │
│  /api/*         │    │  + User Session  │    │ Granular Access │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Why This Architecture?

**Admin Operations (Service Role):**
- Maximum permissions for content management
- Bypasses all Row Level Security (RLS) policies
- Used by admin forms, publishing, content creation
- Requires admin route authentication via middleware

**Public Operations (RLS Policies):**
- Granular permissions for end users
- Secure access to published content only
- Used by public APIs and content display
- Filtering and access control via database policies

## Admin Authentication

### Route Protection

Admin routes (`/admin/*`) are protected by:

1. **Middleware authentication check** (`src/middleware.ts`)
2. **Admin role verification** in `user_preferences` table
3. **Development mode bypass** via `NEXT_PUBLIC_DEV_MODE=true`

### Service Role Usage

All admin Server Actions use the service role client:

```typescript
// Admin operations
const supabase = createServiceRoleSupabaseClient();
```

This client:
- ✅ **Bypasses all RLS policies**
- ✅ **Has full database access**
- ✅ **Used only in secure server-side operations**

## RLS Policies

### Public Content Access

Published content is protected by RLS SELECT policies:
```sql
CREATE POLICY "Public can view published content"
  ON table_name FOR SELECT
  USING (published = true);
```

### Admin Write Access

Admin write operations use `createServiceRoleSupabaseClient()` which bypasses RLS. There are no RLS write policies for admin operations — access control is handled at the application layer via `requireAdmin()` middleware and server action checks.

If admin operations ever move to using the regular client, RLS write policies checking `user_preferences.role` should be added at that time.

## User Authentication

### Session Management

- JWT tokens managed by Supabase Auth
- Automatic refresh via middleware
- Secure cookie storage
- Session validation on protected routes

### User Roles

Currently supports:
- **Regular users** - Can view published content
- **Admin users** - Full content management access

Role stored in `user_preferences.role` field.

## Environment Variables

Required authentication environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development Mode (bypasses admin auth)
NEXT_PUBLIC_DEV_MODE=false

# Content Access Control
REQUIRE_AUTH_FOR_CONTENT=false
NEXT_PUBLIC_REQUIRE_AUTH_FOR_CONTENT=false
```

## Security Best Practices

1. **Never expose service role key** to client-side code
2. **Use middleware** for route-level protection
3. **Validate user roles** before admin operations
4. **Keep RLS policies simple** and focused on public access
5. **Document security architecture** clearly

---

## Admin Setup Guide

### Creating Your First Admin User

OpenQase includes a dedicated script for creating admin users with proper validation and setup.

#### Using the Setup Script

```bash
# Run the interactive admin setup
npm run setup-admin

# Or with tsx directly
npx tsx scripts/setup-admin.ts
```

#### What the Script Does

1. **Validates Environment** - Checks that Supabase credentials are configured
2. **Tests Database Connection** - Ensures Supabase is accessible
3. **Validates Credentials** - Enforces password requirements:
   - At least 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
4. **Creates User** - Creates the user account in Supabase Auth
5. **Sets Admin Role** - Adds `role: 'admin'` to `user_preferences` table

#### Password Requirements

Admin passwords must meet these security requirements:
- **Minimum length**: 8 characters
- **Uppercase**: At least one (A-Z)
- **Lowercase**: At least one (a-z)
- **Number**: At least one digit (0-9)

Example of valid passwords:
- `AdminPass123`
- `SecureQ1!`
- `MyP@ssw0rd`

#### Environment Variables for Setup

You can provide credentials via environment variables to automate setup:

```bash
# Add to .env.local
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePass123
```

Then run:
```bash
npm run setup-admin
```

The script will use these values automatically without prompting.

#### Accessing the Admin Panel

After setup:

1. Start your development server: `npm run dev`
2. Navigate to: http://localhost:3000/admin
3. You'll be redirected to `/auth?redirectTo=/admin`
4. Sign in with your admin credentials
5. You'll be redirected back to the admin panel

### Development Mode Bypass

For local development, you can bypass authentication checks:

```bash
# .env.local
NEXT_PUBLIC_DEV_MODE=true
```

**⚠️ Security Warning:**
- Only works on localhost/127.0.0.1
- Never enable in production
- Bypasses ALL admin authentication checks

---

## Session Management Patterns

### Client-Side (Browser)

Use the browser client for client components:

```typescript
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [user, setUser] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <div>User: {user?.email}</div>;
}
```

### Server-Side (Server Components)

Use the server client for server components and API routes:

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function MyServerComponent() {
  const supabase = await createServerSupabaseClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Query with user's session (respects RLS)
  const { data } = await supabase
    .from('case_studies')
    .select('*')
    .eq('published', true);

  return <div>Welcome {user.email}</div>;
}
```

### Admin Operations (Service Role)

Use the service role client for admin operations:

```typescript
'use server';

import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function adminAction() {
  // 1. First, verify the user is an admin
  const userSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userPrefs } = await userSupabase
    .from('user_preferences')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userPrefs?.role !== 'admin') {
    throw new Error('Admin access required');
  }

  // 2. Then use service role for the operation
  const adminSupabase = createServiceRoleSupabaseClient();

  const { data, error } = await adminSupabase
    .from('case_studies')
    .insert({ title: 'New Case Study' });

  if (error) throw error;
  return data;
}
```

### Middleware (Request Interception)

The middleware handles session refresh and route protection:

```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  // Update session (refresh tokens if needed)
  const res = await updateSession(req);

  // Check authentication for admin routes
  if (isAdminRoute) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth?redirectTo=/admin', req.url));
    }

    // Verify admin role
    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userPreferences || userPreferences.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}
```

---

## RLS Policy Examples

### Public Content Access

Allow anyone to read published content:

```sql
CREATE POLICY "Public can view published case studies"
  ON case_studies FOR SELECT
  USING (published = true AND deleted_at IS NULL);
```

### Admin Write Access

Admin operations use `createServiceRoleSupabaseClient()` which bypasses RLS. Access control is enforced at the application layer via `requireAdmin()`.

### User-Owned Content

For user-specific data:

```sql
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = id);
```

---

## Common Issues & Solutions

### Issue: "Not authenticated" error in admin panel

**Symptoms:**
- Redirected to login when trying to access `/admin`
- Session seems to expire immediately

**Solutions:**

1. **Check Supabase is running** (local development):
   ```bash
   supabase status
   # If not running:
   supabase start
   ```

2. **Verify environment variables**:
   ```bash
   # Check .env.local has correct values
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Clear browser cookies**:
   - Open DevTools → Application → Cookies
   - Delete all cookies for localhost:3000
   - Refresh and try logging in again

4. **Check admin role in database**:
   ```sql
   SELECT id, role FROM user_preferences WHERE role = 'admin';
   ```

### Issue: "Invalid login credentials" after setup

**Symptoms:**
- Admin user created successfully
- Cannot log in with credentials

**Solutions:**

1. **Check email confirmation** (if enabled in Supabase):
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user
   - Check if "Email Confirmed" is true
   - If false, click to manually confirm

2. **Password doesn't meet requirements**:
   - Must have: 8+ chars, uppercase, lowercase, number
   - Reset password using forgot password flow

3. **User exists but wrong password**:
   ```bash
   # Delete and recreate user in Supabase Dashboard
   # Or update password via Supabase Auth UI
   ```

### Issue: Admin role not working

**Symptoms:**
- Can log in but redirected away from `/admin`
- "Admin access required" errors

**Solutions:**

1. **Check user_preferences table**:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM user_preferences WHERE id = 'your-user-id';
   ```

2. **Manually set admin role**:
   ```sql
   INSERT INTO user_preferences (id, role)
   VALUES ('your-user-id', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

3. **Re-run setup script**:
   ```bash
   npm run setup-admin
   # Say "yes" when asked if user exists
   ```

### Issue: "JWT expired" or "Invalid JWT" errors

**Symptoms:**
- Random auth failures
- Works sometimes, fails other times

**Solutions:**

1. **Update Supabase packages**:
   ```bash
   npm install @supabase/ssr@latest @supabase/supabase-js@latest
   ```

2. **Check middleware is running**:
   - Middleware should refresh tokens automatically
   - Verify `src/middleware.ts` includes your route in matcher

3. **Manual token refresh**:
   ```typescript
   const { data, error } = await supabase.auth.refreshSession();
   ```

### Issue: CORS errors with Supabase

**Symptoms:**
- CORS errors in browser console
- API calls failing from frontend

**Solutions:**

1. **Check Supabase URL is correct**:
   ```bash
   # Should NOT have trailing slash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   ```

2. **Verify allowed origins** in Supabase Dashboard:
   - Authentication → URL Configuration
   - Add: `http://localhost:3000`

3. **Check for mixed content** (HTTP/HTTPS):
   - Supabase uses HTTPS
   - Local dev should use HTTP
   - No mixing allowed

### Issue: Service role key not working

**Symptoms:**
- Admin operations failing
- "Invalid API key" errors
- RLS bypassing not working

**Solutions:**

1. **Verify service role key** in .env.local:
   ```bash
   # Get from Supabase Dashboard → Settings → API
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...very_long_key
   ```

2. **Check for whitespace**:
   - Key is automatically trimmed in code
   - But verify no extra quotes or spaces

3. **Never expose to client**:
   - Service role key should ONLY be in server-side code
   - Never in `NEXT_PUBLIC_*` variables
   - Never sent to browser

---

## Security Checklist

Before deploying to production:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set and secure
- [ ] `NEXT_PUBLIC_DEV_MODE` is NOT set or set to `false`
- [ ] Admin users have strong passwords (8+ chars, mixed case, numbers)
- [ ] RLS policies are enabled on all tables
- [ ] Public content queries only access `published = true` rows
- [ ] Soft delete policies check `deleted_at IS NULL`
- [ ] Test admin access requires authentication
- [ ] Test non-admin users cannot access `/admin`
- [ ] Environment variables are not committed to git
- [ ] Supabase project has 2FA enabled for admin access

---

*Last updated: v0.5.0 - Comprehensive authentication patterns documented* 
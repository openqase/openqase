# Installation & Local Development

Complete guide to setting up OpenQase locally for development.

## Prerequisites

- [Node.js](https://nodejs.org/) (Version >= 18.0)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (recommended)
- [Docker](https://www.docker.com/) (required for local Supabase)

## Quick Start

### Option A: Automated Setup (Recommended)
```bash
# 1. Clone and install
git clone https://github.com/openqase/openqase.git
cd openqase
npm install

# 2. Run automated setup script
bash scripts/setup-local.sh

# 3. Configure environment (if needed)
cp .env.example .env.local
# Update with your Supabase credentials from 'supabase status'

# 4. Run the application
npm run dev
```

### Option B: Manual Setup
```bash
# 1. Clone and install
git clone https://github.com/openqase/openqase.git
cd openqase
npm install

# 2. Set up local Supabase
supabase start

# 3. Configure environment
cp .env.example .env.local
# Add your Supabase credentials (see below)

# 4. Run the application
npm run dev
```

## Detailed Setup

### 1. Clone Repository

```bash
git clone https://github.com/openqase/openqase.git
cd openqase
npm install
```

### 2. Supabase Local Development

OpenQase uses Supabase for database and authentication. For local development, run a local Supabase instance:

```bash
# Start local Supabase services
supabase start
```

This starts the local Supabase stack using Docker, including:
- Database (PostgreSQL)
- Authentication
- Storage
- API Gateway

Get your local credentials:
```bash
supabase status
```

Output will look like:
```
     API URL: http://localhost:54321
   GraphQL URL: http://localhost:54321/graphql/v1
      DB URL: postgresql://postgres:postgres@localhost:54322/postgres
  Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
  JWT secret: your-local-jwt-secret
    anon key: your-local-anon-key
service_role key: your-local-service-role-key
```

### 3. Environment Configuration

Create your local environment file:

```bash
cp .env.example .env.local
```

Configure with your local Supabase credentials:

```bash
# .env.local

# Supabase Configuration (from 'supabase status')
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Service (Optional for local development)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@localhost

# Newsletter Integration (Required for newsletter signup)
BEEHIIV_API_KEY=your-beehiiv-api-key
BEEHIIV_PUBLICATION_ID=your-beehiiv-publication-id

# Admin Setup (Required for content management and soft delete)
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=your-secure-password

# Development Mode (Optional - See Security Note below)
NEXT_PUBLIC_DEV_MODE=false
```

**Important**: Never commit `.env.local` to version control.

### 4. Database Setup

The local Supabase instance automatically applies migrations from `supabase/migrations/`.

To reset the database (clean slate):
```bash
supabase db reset
```

To create a new migration:
```bash
supabase migration new migration_name
```

### 5. Run the Application

Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 6. Automated Local Setup (Alternative)

For a streamlined setup experience, use the automated setup script:

```bash
bash scripts/setup-local.sh
```

This script:
- **Checks Prerequisites**: Verifies Supabase CLI is installed
- **Starts Supabase**: Automatically starts your local Supabase instance
- **Interactive Data Setup**: Choose from three options:
  1. **Example Data** (recommended for contributors) - Uses sample data from `supabase/seed.sql`
  2. **Production Data** - Uses real data from `private-data/production-seed.sql` if available
  3. **Empty Database** - Start with a clean slate
- **Database Reset**: Applies migrations and loads selected seed data
- **Provides Next Steps**: Clear guidance on what to do next

**Data Setup Options:**
- **Example Data**: Perfect for development and testing
- **Production Data**: For working with real content (requires access to production data)
- **Empty Database**: When you want to build content from scratch

After running the script, you'll have a fully configured local development environment ready to use.

### 7. Admin Setup (Required for Content Management)

To create an admin user for content management and soft delete features:

```bash
npm run setup-admin
```

This script will prompt you for admin credentials and set up the necessary permissions for:
- Accessing the admin interface at `/admin`
- Using the soft delete system for content management
- Managing featured content on the homepage
- Creating and editing all content types

### 7. Development Mode (Optional)

For development convenience, you can enable a mode that simplifies local admin access:

```bash
node scripts/enable-dev-mode.js
```

⚠️ **Security Note**: Development mode is restricted to localhost only and should never be used in production environments.

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
supabase start          # Start local Supabase
supabase stop           # Stop local Supabase
supabase db reset       # Reset local database

# Setup & Admin  
bash scripts/setup-local.sh    # Automated local development setup
npm run setup-admin            # Create admin user
npm run enable-dev-mode        # Enable development features

# Performance
npm run test-performance # Run performance tests
node scripts/page-load-performance.js # Test real page load performance
tsx scripts/performance-monitor.ts [command] # Comprehensive performance monitoring
bash scripts/run-performance-test.sh # Quick shell-based performance diagnostics

# Import System
tsx scripts/import-case-studies-with-mapping.ts <directory> # Import case studies

# Documentation Generation
tsx scripts/get-schema.ts       # Generate schema documentation
```

## Development Utilities

### Schema Documentation Generation

OpenQase includes a utility to automatically generate database schema documentation:

```bash
tsx scripts/get-schema.ts
```

This script:
- Connects to your configured Supabase instance
- Examines all main tables (algorithms, case_studies, industries, personas, user_preferences)
- Generates markdown documentation with column names and data types
- Outputs to `docs/supabase-schema.md`

The generated documentation helps developers understand the database structure and is useful for:
- Onboarding new developers
- API development reference
- Database migration planning

**Note**: This script requires a live database connection and will fail if no data exists in the tables.

### Performance Testing

OpenQase includes tools for monitoring database and page load performance:

```bash
node scripts/page-load-performance.js
```

This script:
- Simulates real page loads for admin dashboard, persona pages, and case study pages
- Measures database query performance with detailed breakdowns
- Tests actual content from your database using real slugs
- Identifies performance bottlenecks and provides optimization recommendations
- Reports timing for all database queries with record counts

**Performance Benchmarks:**
- **Good**: <200ms page load time
- **Warning**: 200-500ms page load time  
- **Critical**: >500ms page load time

The script provides actionable recommendations for database indexing, query optimization, and caching strategies.

#### Comprehensive Performance Monitoring

For continuous performance monitoring and CI/CD integration:

```bash
tsx scripts/performance-monitor.ts [command]
```

**Available Commands:**
- `full` (default) - Complete performance test including build, server start, and page loads
- `build` - Measure build time only
- `server` - Measure server startup time only  
- `pages` - Test page load times only
- `admin` - Admin operations performance test

**Features:**
- Automated build time measurement
- Server startup time tracking
- Page load testing with real URLs
- Memory usage analysis  
- JSON performance reports saved to `./performance-reports/`
- CLI interface for different test scenarios
- Error tracking and reporting

**Example Usage:**
```bash
# Full performance test
tsx scripts/performance-monitor.ts

# Test only build performance
tsx scripts/performance-monitor.ts build

# Test page load times
tsx scripts/performance-monitor.ts pages
```

This tool is ideal for CI/CD pipelines and regular performance monitoring.

#### Quick Performance Diagnostics

For rapid performance testing and troubleshooting:

```bash
bash scripts/run-performance-test.sh
```

This shell script provides:
- **Build Performance**: Times the complete build process
- **Page Load Testing**: Tests real page URLs with curl timing
- **Manual Testing Guide**: Instructions for browser-based performance analysis
- **Admin Page Testing**: Attempts to test admin routes
- **Development Server**: Automatically starts/stops dev server for testing

**What it tests:**
- Case study pages, algorithm pages, persona pages, industry pages
- Admin dashboard (if accessible)
- Build time measurement
- Server startup time

**Manual testing guidance for:**
- JavaScript bundle sizes and loading times
- API calls during page load (should be zero for static pages)
- Browser developer tools analysis
- Memory usage and performance bottlenecks

This script is perfect for quick performance checks during development.

## Development Workflow

1. **Start Supabase**: `supabase start`
2. **Start Next.js**: `npm run dev`
3. **Access admin**: Visit `/admin` (requires admin setup)
4. **View database**: Supabase Studio at `http://localhost:54323`

## Troubleshooting

### Common Issues

**Port conflicts**: If ports are in use, stop other services or configure different ports
**Docker issues**: Ensure Docker is running before `supabase start`
**Migration errors**: Run `supabase db reset` to start fresh
**Environment variables**: Verify all required variables are set in `.env.local`

### Getting Help

- Check the [API Documentation](./api-documentation.md)
- Review [Import System](./import-system.md) for data import
- See [Scripts Documentation](./import-system.md) for available utilities

## Next Steps

- Visit [http://localhost:3000](http://localhost:3000) to see the application
- Access admin interface at [http://localhost:3000/admin](http://localhost:3000/admin)
- View database at [http://localhost:54323](http://localhost:54323) (Supabase Studio)
- Read the [API Documentation](./api-documentation.md) for development patterns
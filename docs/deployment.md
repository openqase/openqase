# Production Deployment

Complete guide to deploying OpenQase to production environments.

## Environment Variables

### Required Variables

```bash
# Public URLs
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@your-domain.com

# Admin Setup
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your-secure-password
```

### Optional Variables

```bash
# Analytics
VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# Error Monitoring (Sentry)
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## Pre-Deployment Checklist

### 1. Database Setup

**Apply Migrations**:
```bash
# Push all migrations to production database
supabase db push --linked
```

**Verify Schema**:
```sql
-- Check that import system columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'case_studies' 
AND column_name IN (
  'import_batch_name', 'year', 'import_batch_id', 
  'import_source', 'import_timestamp', 
  'original_qookie_id', 'original_qookie_slug'
);
```

### 2. Security Configuration

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Proper authentication policies configured
- ✅ Service role key secured and not exposed
- ✅ CORS settings configured for your domain
- ✅ SSL/TLS certificates configured

### 3. Content Preparation

**Seed Reference Data**:
```bash
# Ensure algorithms, industries, and personas exist
tsx scripts/populate-entities.ts
```

**Import Case Studies** (if needed):
```bash
# Test with dry run first
tsx scripts/import-case-studies-with-mapping.ts /path/to/json/files

# Import with commit
tsx scripts/import-case-studies-with-mapping.ts /path/to/json/files --commit
```

## Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**:
   - Link your GitHub repository to Vercel
   - Configure build settings (default Next.js settings work)

2. **Environment Variables**:
   - Add all required environment variables in Vercel dashboard
   - Use environment-specific values (production, preview, development)

3. **Deploy**:
   - Automatic deployment on push to main branch
   - Preview deployments for pull requests

4. **Domain Configuration**:
   - Add your custom domain in Vercel dashboard
   - Configure DNS records as instructed

### Other Platforms

**Requirements**:
- Node.js 18+ support
- Build command: `npm run build`
- Start command: `npm run start`
- Environment variable support

**Popular alternatives**:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

---

## Docker Deployment

> **Note:** The Docker and CI/CD configurations below are reference templates. They are not included in the repository and must be created if needed.

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

For local development with services:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SITE_URL=http://localhost:3000
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Docker Build & Run

```bash
# Build image
docker build -t openqase:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://your-domain.com \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -e RESEND_API_KEY=your-resend-key \
  openqase:latest

# Or with docker-compose
docker-compose up -d
```

### Docker Registry Deployment

```bash
# Tag for registry
docker tag openqase:latest registry.example.com/openqase:v1.0.0

# Push to registry
docker push registry.example.com/openqase:v1.0.0

# Pull and run on production
docker pull registry.example.com/openqase:v1.0.0
docker run -d --name openqase -p 3000:3000 registry.example.com/openqase:v1.0.0
```

---

## Self-Hosting on VPS

### Server Requirements

**Minimum Specifications:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Ubuntu 22.04 LTS or similar

**Recommended Specifications:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Ubuntu 22.04 LTS

### Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (SSL certificates)
sudo apt install -y certbot python3-certbot-nginx

# Create application user
sudo useradd -m -s /bin/bash openqase
sudo usermod -aG sudo openqase
```

### Application Setup

```bash
# Switch to application user
sudo su - openqase

# Clone repository
git clone https://github.com/your-org/openqase.git
cd openqase

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
nano .env.local  # Configure environment variables

# Build application
npm run build

# Start with PM2
pm2 start npm --name "openqase" -- start
pm2 save
pm2 startup  # Follow instructions to enable auto-start

# Monitor application
pm2 logs openqase
pm2 monit
```

### Nginx Configuration

Create `/etc/nginx/sites-available/openqase`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optimize static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Optimize images
    location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site and obtain SSL:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/openqase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Maintenance Scripts

Create `/home/openqase/scripts/update.sh`:

```bash
#!/bin/bash
cd /home/openqase/openqase

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart openqase

# Show status
pm2 status
```

Create `/home/openqase/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/openqase/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup environment file
cp /home/openqase/openqase/.env.local $BACKUP_DIR/.env.local.$TIMESTAMP

# Backup with tar
tar -czf $BACKUP_DIR/openqase_$TIMESTAMP.tar.gz \
    /home/openqase/openqase \
    --exclude=node_modules \
    --exclude=.next

# Keep only last 7 backups
ls -t $BACKUP_DIR/openqase_*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: $BACKUP_DIR/openqase_$TIMESTAMP.tar.gz"
```

Setup cron for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/openqase/scripts/backup.sh >> /home/openqase/logs/backup.log 2>&1
```

---

## CI/CD Pipeline Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20.x'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npx tsc --noEmit

      - name: Run linting
        run: npm run lint || true

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.DOCKER_REGISTRY }}
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_REGISTRY }}/openqase:latest
            ${{ secrets.DOCKER_REGISTRY }}/openqase:${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.DOCKER_REGISTRY }}/openqase:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_REGISTRY }}/openqase:buildcache,mode=max

  deploy-vps:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/openqase/openqase
            git pull origin main
            npm install
            npm run build
            pm2 restart openqase
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

cache:
  paths:
    - node_modules/
    - .next/cache/

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npx tsc --noEmit
    - npm run lint || true
    - npm run build
  only:
    - main
    - merge_requests

build-docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -t $CI_REGISTRY_IMAGE:latest .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main

deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
        cd /home/openqase/openqase &&
        git pull origin main &&
        npm install &&
        npm run build &&
        pm2 restart openqase
      "
  only:
    - main
  when: manual
```

### Environment-Specific Configurations

**Development (.env.development):**
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
# ... development credentials
```

**Staging (.env.staging):**
```bash
NEXT_PUBLIC_SITE_URL=https://staging.your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
# ... staging credentials
```

**Production (.env.production):**
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
# ... production credentials
```

---

## AWS Deployment

### AWS Amplify

1. **Connect Repository:**
   - Open AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect GitHub repository
   - Select branch (main for production)

2. **Build Settings:**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

3. **Environment Variables:**
   - Add all required environment variables in Amplify Console
   - Use AWS Secrets Manager for sensitive values

4. **Custom Domain:**
   - Add domain in Amplify Console
   - Update DNS records as instructed
   - SSL certificate automatically provisioned

### AWS EC2

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.medium (minimum)
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)
   - Key pair for SSH access

2. **Setup (same as VPS setup above)**

3. **Load Balancer (optional):**
   - Create Application Load Balancer
   - Target group pointing to EC2 instance(s)
   - SSL certificate via AWS Certificate Manager

### AWS ECS (Container Service)

1. **Create ECR Repository:**
   ```bash
   aws ecr create-repository --repository-name openqase
   ```

2. **Build and Push Image:**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag
   docker build -t openqase .
   docker tag openqase:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/openqase:latest

   # Push
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/openqase:latest
   ```

3. **Create ECS Task Definition:**
   ```json
   {
     "family": "openqase",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "containerDefinitions": [
       {
         "name": "openqase",
         "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/openqase:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "SUPABASE_SERVICE_ROLE_KEY",
             "valueFrom": "arn:aws:secretsmanager:region:account:secret:openqase/supabase-key"
           }
         ]
       }
     ]
   }
   ```

4. **Create ECS Service:**
   - Select Fargate launch type
   - Configure VPC and subnets
   - Attach load balancer
   - Enable auto-scaling

---

## Google Cloud Platform (GCP)

### Cloud Run

1. **Build Container:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/openqase
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy openqase \
     --image gcr.io/PROJECT_ID/openqase \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "NODE_ENV=production" \
     --set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-key:latest"
   ```

3. **Custom Domain:**
   ```bash
   gcloud run domain-mappings create \
     --service openqase \
     --domain your-domain.com \
     --region us-central1
   ```

### GCE (Compute Engine)

1. **Create VM Instance:**
   ```bash
   gcloud compute instances create openqase-vm \
     --image-family ubuntu-2204-lts \
     --image-project ubuntu-os-cloud \
     --machine-type e2-medium \
     --boot-disk-size 50GB \
     --zone us-central1-a
   ```

2. **Setup (same as VPS setup above)**

3. **Load Balancer:**
   ```bash
   # Create instance group
   gcloud compute instance-groups unmanaged create openqase-group --zone us-central1-a
   gcloud compute instance-groups unmanaged add-instances openqase-group \
     --instances openqase-vm \
     --zone us-central1-a

   # Create load balancer
   gcloud compute forwarding-rules create openqase-lb \
     --global \
     --target-http-proxy openqase-proxy \
     --ports 80
   ```

---

## Post-Deployment Setup

### 1. Admin User Setup

Create your first admin user:

```bash
# Update ADMIN_EMAIL in environment variables first
npm run setup-admin
```

Or manually via Supabase dashboard:
1. Create user in Authentication > Users
2. Add user ID to admin-related policies
3. Grant necessary permissions

### 2. Content Management

Access the admin interface at `/admin`:
- ✅ Case studies management and bulk operations
- ✅ Algorithm, industry, and persona management
- ✅ Import system for bulk data uploads
- ✅ Publishing workflows

### 3. Email Configuration

**Resend Setup**:
1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Generate API key and add to environment variables
4. Configure sender address (`RESEND_FROM_EMAIL`)

**Email Features**:
- Newsletter subscriptions
- Admin notifications
- System alerts

## Verification Steps

### Application Health Check

- [ ] Homepage loads correctly
- [ ] Case studies display properly
- [ ] Search functionality works
- [ ] Admin interface accessible
- [ ] Authentication working

### Import System Check

- [ ] Import scripts can connect to database
- [ ] Entity mappings load correctly
- [ ] Batch operations work in admin interface
- [ ] Import history displays properly

### Database Verification

```sql
-- Check data integrity
SELECT 
    COUNT(*) as total_case_studies,
    COUNT(CASE WHEN published = true THEN 1 END) as published,
    COUNT(CASE WHEN import_batch_name IS NOT NULL THEN 1 END) as imported
FROM case_studies;

-- Check relationships
SELECT 
    'algorithms' as entity_type,
    COUNT(*) as relationships
FROM algorithm_case_study_relations
UNION ALL
SELECT 
    'industries' as entity_type,
    COUNT(*) as relationships  
FROM case_study_industry_relations
UNION ALL
SELECT 
    'personas' as entity_type,
    COUNT(*) as relationships
FROM case_study_persona_relations;
```

## Monitoring & Maintenance

### Performance Monitoring

**Vercel Analytics**:
- Page views and user engagement
- Core Web Vitals tracking
- Geographic distribution

**Custom Metrics**:
- Newsletter subscription rates
- Content engagement
- Admin usage patterns

### Error Monitoring

**Sentry Integration**:
- Automatic error capture
- Performance monitoring
- Release tracking

**Health Checks**:
- Database connectivity
- External service availability
- Content delivery performance

### Backup Strategy

**Database Backups**:
- Automated daily backups via Supabase
- Point-in-time recovery available
- Manual backup before major changes

**Content Backups**:
- Regular exports of case studies
- Import system provides rollback capabilities
- Version control for configuration changes

## Rollback Procedures

### Application Rollback

**Vercel**:
1. Go to deployments in dashboard
2. Select previous working deployment
3. Click "Promote to Production"

### Database Rollback

**Import System Rollback**:
```sql
-- Rollback specific import batch
DELETE FROM case_studies WHERE import_batch_name = 'QK-XXX';
```

**Schema Rollback**:
```bash
# Revert to previous migration
supabase migration rollback
```

### Emergency Contacts

- Database issues: Supabase support
- Deployment issues: Vercel support  
- Email delivery: Resend support
- DNS/Domain: Your domain provider

## Security Considerations

### Environment Security

- ✅ Never commit actual environment values
- ✅ Use secure, randomly generated keys
- ✅ Rotate keys regularly
- ✅ Monitor for key exposure

### Application Security

- ✅ All database queries use prepared statements
- ✅ Input validation on all forms
- ✅ Rate limiting on API endpoints
- ✅ CSRF protection enabled

### Data Security

- ✅ RLS policies prevent unauthorized access
- ✅ Admin actions logged and auditable
- ✅ User data handled according to privacy policies
- ✅ Regular security updates applied

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build:analyze

# Static export (if applicable)
NEXT_STATIC_EXPORT=true npm run build
```

### Caching Strategy

- Static assets cached via CDN
- API responses cached appropriately
- Database queries optimized with indexes
- Image optimization enabled

### Content Delivery

- Images served via Supabase Storage or CDN
- Static content pre-generated at build time
- Dynamic content cached at edge locations 
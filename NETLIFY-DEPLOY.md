# STA-CRM Deployment Guide for Netlify and Supabase

This document outlines the deployment process for the STA-CRM application using Netlify for frontend hosting and Supabase for database and storage.

## Git Branch Strategy

We use a multi-branch deployment strategy to manage different environments:

1. **Main Branch (`main`)**
   - Production environment
   - Deployed to: `https://sta-crm.netlify.app` (or your custom domain)
   - Contains stable, tested code ready for customers
   - Changes must go through Pull Request review

2. **Staging Branch (`staging`)**
   - Pre-production testing environment
   - Deployed to: `https://staging--sta-crm.netlify.app`
   - Used for final QA before promoting to production
   - Should be kept as close to production as possible

3. **Development Branch (`development`)**
   - Development environment
   - Deployed to: `https://development--sta-crm.netlify.app`
   - Contains the latest features and fixes
   - Primary integration branch for developers

4. **Feature Branches (`feature/...`)**
   - Created from the development branch
   - Used for individual feature development
   - Merged back to development after completion
   - Can be deployed to preview URLs for testing

## Deployment Setup

### Supabase Setup

1. **Create Supabase Projects**

   Create three separate projects in Supabase:
   - `sta-crm-production`
   - `sta-crm-staging`
   - `sta-crm-development`

2. **Initialize Schema**

   For each project, run the migration script:
   ```bash
   npx supabase db push --db-url=[YOUR_SUPABASE_DB_URL]
   ```

3. **Enable Storage**

   For each project:
   - Go to Storage in the Supabase dashboard
   - Create buckets for: `avatars`, `product-images`, `attachments`
   - Configure CORS settings as needed
   - Set appropriate bucket policies

### Netlify Setup

1. **Connect Repository**

   - Login to Netlify
   - Click "New site from Git"
   - Select your repository
   - Configure build settings:
     - Build command: `npm run netlify-build`
     - Publish directory: `.next`

2. **Configure Environment Variables**

   In Netlify's dashboard, add the following environment variables for each deployment context:

   **Base variables (shared across all environments):**
   ```
   NEXT_PUBLIC_AUTH_SECRET=[your-auth-secret]
   JWT_SECRET=[your-jwt-secret]
   ```

   **Production environment:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=[production-supabase-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[production-service-key]
   NEXT_PUBLIC_SITE_URL=https://sta-crm.netlify.app
   NEXT_PUBLIC_SITE_ENV=production
   ```

   **Staging environment:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=[staging-supabase-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[staging-service-key]
   NEXT_PUBLIC_SITE_URL=https://staging--sta-crm.netlify.app
   NEXT_PUBLIC_SITE_ENV=staging
   ```

   **Development environment:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=[development-supabase-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[development-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[development-service-key]
   NEXT_PUBLIC_SITE_URL=https://development--sta-crm.netlify.app
   NEXT_PUBLIC_SITE_ENV=development
   ```

3. **Enable Branch Deploys**

   - Go to Site Settings > Build & Deploy > Continuous Deployment
   - Enable "Branch deploys" for `staging` and `development` branches
   - Set "Branch deploy creating URLs with" to "Pretty URLs"

4. **Install Netlify CLI**

   ```bash
   npm install netlify-cli -g
   netlify login
   ```

## Deployment Process

### Initial Deployment

1. **Push Code to Main Branches**

   ```bash
   # Initial setup of branches
   git checkout -b main
   git push -u origin main

   git checkout -b staging
   git push -u origin staging

   git checkout -b development
   git push -u origin development
   ```

2. **Deploy Each Branch**

   Netlify will automatically deploy all branches that have deploy settings enabled.

### Ongoing Development

1. **Feature Development**

   ```bash
   # Create feature branch from development
   git checkout development
   git pull
   git checkout -b feature/my-new-feature

   # Make changes and commit
   # ...

   # Push feature branch
   git push -u origin feature/my-new-feature
   ```

2. **Preview Deployment**

   - Create a Pull Request from your feature branch to the `development` branch
   - Netlify will create a preview deployment for your PR
   - Review and test the preview deployment

3. **Promote to Development**

   - Once approved, merge the PR into `development`
   - Netlify will automatically deploy to the development environment

4. **Promote to Staging**

   ```bash
   git checkout staging
   git pull
   git merge development
   git push origin staging
   ```

5. **Promote to Production**

   ```bash
   git checkout main
   git pull
   git merge staging
   git push origin main
   ```

## Managing Supabase Schema Changes

When making database schema changes:

1. **Create Migration Scripts**

   Place new migration scripts in `supabase/migrations` using sequential numbering.

2. **Apply to Development First**

   ```bash
   # Apply to development environment
   SUPABASE_URL=your-dev-supabase-url SUPABASE_KEY=your-dev-key npx supabase db push
   ```

3. **Test Thoroughly**

   Ensure your changes work correctly in the development environment.

4. **Apply to Staging**

   ```bash
   # Apply to staging environment
   SUPABASE_URL=your-staging-supabase-url SUPABASE_KEY=your-staging-key npx supabase db push
   ```

5. **Apply to Production**

   ```bash
   # Apply to production environment
   SUPABASE_URL=your-prod-supabase-url SUPABASE_KEY=your-prod-key npx supabase db push
   ```

## Rollback Process

### Frontend Rollback

If a deployment causes issues:

1. **Netlify Rollback**

   - Go to the Netlify dashboard > Deploys
   - Find the last working deployment
   - Click "Publish deploy" to roll back

2. **Git Rollback**

   ```bash
   # Revert the problematic merge/commit
   git revert <commit-hash>
   git push
   ```

### Database Rollback

For database rollbacks:

1. Create a new migration script that reverts the changes
2. Apply the rollback migration to the affected environment

## Monitoring

Monitor your deployments using:

- Netlify deploy logs
- Supabase database logs
- Application error tracking
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Netlify build logs
   - Ensure all dependencies are installed
   - Verify environment variables are set correctly

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure IP restrictions aren't blocking access

3. **Storage Access Problems**
   - Check bucket policies
   - Verify storage permissions
   - Ensure correct paths are used in code

For additional help, refer to:
- [Netlify Docs](https://docs.netlify.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

## Summary of Netlify Integration Features

We've implemented the following features for Netlify deployment:

### 1. Environment-Specific Configuration

- Created `.env.development`, `.env.staging`, and `.env.production` files for environment-specific variables
- Updated `netlify.toml` to configure each deployment environment based on the Git branch
- Added environment indicators in NetworkStatus component

### 2. API Integration

- Created Netlify serverless function proxy for the Express API server
- Updated the API client to automatically detect environment-specific API URLs
- Implemented proper error handling and retries for API requests

### 3. Authentication

- Updated the auth context to use Supabase authentication
- Implemented middleware for protecting routes based on authentication state
- Added proper session handling for different environments

### 4. Deployment Scripts

- Created deployment scripts for both Windows (PowerShell) and Unix (Bash) environments
- Set up GitHub Actions for automated branch synchronization
- Added Netlify build script for preparing both the Next.js app and server for deployment

### 5. Monitoring and Debugging

- Added NetworkStatus component to display API connection status and current environment
- Implemented proper error handling and logging
- Created health check endpoints for monitoring

## Deployment Checklist

Before deploying to Netlify, ensure you have:

1. ✓ Set up the three Supabase environments (development, staging, production)
2. ✓ Created the necessary Supabase storage buckets using our setup script
3. ✓ Set up environment variables in the Netlify dashboard
4. ✓ Initialized the three Git branches for deployment
5. ✓ Configured the Netlify sites for each environment
6. ✓ Connected the Netlify sites to the appropriate Git branches

## Known Limitations

- File uploads larger than 50MB may need to use Supabase storage directly rather than via the API
- The free tier of Netlify has limitations on build minutes per month
- Serverless functions have cold start times that may affect performance on the first request 
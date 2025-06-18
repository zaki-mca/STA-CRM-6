# STA-CRM Deployment Steps

This document provides the step-by-step process to deploy the STA-CRM application to Netlify using Git branch deployment strategy and Supabase for database and storage.

## Prerequisites

1. **Accounts Setup:**
   - A Netlify account (sign up at [netlify.com](https://www.netlify.com/))
   - A Supabase account (sign up at [supabase.com](https://supabase.com/))
   - GitHub account with repository access

2. **Tools Installation:**
   - Node.js 18 or later
   - Git

## Step 1: Set Up Supabase Projects

1. **Create Supabase Projects:**
   - Log in to the [Supabase Dashboard](https://app.supabase.com/)
   - Create three separate projects (for production, staging, and development):
     - `sta-crm-production`
     - `sta-crm-staging`
     - `sta-crm-development`

2. **Initialize Schema in Each Project:**
   - Navigate to the SQL Editor in your Supabase project
   - Copy the contents of `supabase/migrations/00001_initial_schema.sql`
   - Execute the SQL script in each project

3. **Set Up Storage Manually:**
   - In each Supabase project, navigate to Storage
   - Create the following buckets:
     - `avatars` (set to public)
     - `product-images` (set to public)
     - `attachments`
     - `invoice-files`
     - `order-attachments`
     - `client-attachments`

4. **Get API Keys:**
   - For each project, navigate to Project Settings > API
   - Copy the URL, anon key, and service role key
   - Store these safely for the next steps

## Step 2: Set Up Git Branch Structure

1. **Initialize Deployment Branches:**
   ```bash
   git checkout -b main
   git push -u origin main
   
   git checkout main
   git checkout -b staging
   git push -u origin staging
   
   git checkout main
   git checkout -b development
   git push -u origin development
   ```

2. **Prepare Deployment Configuration:**
   - Make sure all configuration files are committed and pushed to each branch
   - Each branch should have the appropriate `.env` configuration for its environment

## Step 3: Configure Netlify via Web UI

1. **Create New Site:**
   - Log in to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect to your Git provider
   - Choose the STA-CRM repository
   - Select the branch to deploy (main for production)
   - Configure build settings:
     - Base directory: (leave blank)
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"

2. **Set Up Branch Deploys:**
   - In Netlify dashboard, navigate to Site Settings > Build & Deploy > Continuous Deployment
   - Enable branch deploys for `staging` and `development`
   - Set "Branch deploy creating URLs with" to "Pretty URLs" 
   - This will create URLs like:
     - Production: `https://your-site.netlify.app`
     - Staging: `https://staging--your-site.netlify.app`
     - Development: `https://development--your-site.netlify.app`

3. **Configure Environment Variables:**
   - In Netlify dashboard, navigate to Site Settings > Build & Deploy > Environment
   - Add the required environment variables for the production environment:
     ```
     NEXT_PUBLIC_SUPABASE_URL=<production-project-url>
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
     SUPABASE_SERVICE_ROLE_KEY=<production-service-key>
     NEXT_PUBLIC_SITE_ENV=production
     NEXT_PUBLIC_SITE_URL=https://your-site-name.netlify.app
     NEXT_PUBLIC_AUTH_SECRET=<your-auth-secret>
     JWT_SECRET=<your-jwt-secret>
     ```

4. **Configure Deployment Contexts:**
   - Click "New variable" > "Add variable by context"
   - For the staging branch, add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=<staging-project-url>
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
     SUPABASE_SERVICE_ROLE_KEY=<staging-service-key>
     NEXT_PUBLIC_SITE_ENV=staging
     ```
   - For the development branch, add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=<development-project-url>
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<development-anon-key>
     SUPABASE_SERVICE_ROLE_KEY=<development-service-key>
     NEXT_PUBLIC_SITE_ENV=development
     ```

## Step 4: Manual Deployments

When you want to deploy updates:

1. **Push Changes to the Appropriate Branch:**
   ```bash
   # Example for development branch
   git checkout development
   # Make changes
   git add .
   git commit -m "Your commit message"
   git push origin development
   ```

2. **Netlify Auto Deployment:**
   - Netlify will automatically detect changes and start the deployment
   - You can monitor the deployment progress in the Netlify dashboard

3. **Manual Deployment (if needed):**
   - In Netlify dashboard, go to your site
   - Navigate to Deploys
   - Click "Trigger deploy" > "Deploy site"

## Step 5: Configure Custom Domain (Optional)

1. **Add Custom Domain:**
   - In Netlify dashboard, navigate to Site Settings > Domain Management
   - Click "Add custom domain"
   - Enter your domain name and follow the instructions
   
2. **Configure DNS:**
   - Update your DNS settings as directed by Netlify
   - For apex domains, point to Netlify's load balancer IPs
   - For subdomains, create a CNAME record pointing to your Netlify site

## Setting Up Environment Variables

### Netlify Environment Variables

When deploying to Netlify, you need to configure environment variables in the Netlify dashboard:

1. Go to your Netlify site dashboard 
2. Navigate to **Site settings** > **Environment variables**
3. Add variables for each environment based on `.env.production`, `.env.staging`, and `.env.development`
4. For each environment, make sure to set these critical variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
   - `DATABASE_URL` - PostgreSQL connection string for direct database access
   - `NEXT_PUBLIC_SITE_URL` - The public-facing URL of your site
   - `NEXT_PUBLIC_SITE_ENV` - The environment name (`production`, `staging`, or `development`)
   - `NODE_ENV` - Set to `production` for all deployment environments
   - `JWT_SECRET` - Secret key for JWT authentication
   - `JWT_EXPIRES_IN` - JWT token expiration time (e.g., `1d` for one day)

### Environment-Specific Deployments

Netlify automatically detects the branch being deployed and applies the corresponding environment variables:

- **Production** (`main` branch): Uses production environment variables
- **Staging** (`staging` branch): Uses staging environment variables
- **Development** (`development` branch): Uses development environment variables

For deploy previews (created from pull requests), staging environment variables are used.

## Ongoing Development Workflow

1. **Feature Development:**
   - Create feature branches from `development`
   - Develop and test locally
   - Create PR to merge into `development`
   - After approval, merge to `development` branch
   - Netlify will automatically deploy to development environment

2. **Promotion to Staging:**
   - Test thoroughly in the development environment
   - Merge `development` into `staging`: 
     ```bash
     git checkout staging
     git pull
     git merge development
     git push origin staging
     ```
   - Netlify will automatically deploy to staging environment

3. **Promotion to Production:**
   - Test thoroughly in the staging environment
   - Merge `staging` into `main`: 
     ```bash
     git checkout main
     git pull
     git merge staging
     git push origin main
     ```
   - Netlify will automatically deploy to production environment

## Troubleshooting

**Build Failures:**
- Check Netlify build logs in the dashboard
- Ensure all environment variables are set correctly
- Verify your Next.js configuration is compatible with Netlify

**Database Connection Issues:**
- Verify Supabase URL and keys
- Check network connectivity
- Ensure IP restrictions aren't blocking access

**Storage Access Problems:**
- Check bucket policies
- Verify storage permissions
- Ensure correct paths are used in code

For more detailed deployment guidance, see [NETLIFY-DEPLOY.md](./NETLIFY-DEPLOY.md). 
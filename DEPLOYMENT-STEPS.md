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
   - Netlify CLI (`npm install -g netlify-cli`)
   - Supabase CLI (optional for advanced setup)

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
   - OR copy the URL and key for use with `supabase db push` commands

3. **Set Up Storage:**
   - In each Supabase project, navigate to Storage
   - Create the required buckets:
     ```
     npm run setup:storage
     ```
   - Alternatively, manually create buckets for: `avatars`, `product-images`, `attachments`, etc.

4. **Get API Keys:**
   - For each project, navigate to Project Settings > API
   - Copy the URL, anon key, and service role key
   - For each environment, store these safely for the next steps

## Step 2: Set Up Git Branch Structure

1. **Initialize Deployment Branches:**
   ```bash
   npm run setup:branches
   ```

2. **Push All Branches to Remote:**
   ```bash
   git push -u origin main staging development
   ```

## Step 3: Configure Netlify

1. **Create New Site:**
   - Log in to Netlify Dashboard
   - Click "New site from Git"
   - Connect to your Git provider
   - Choose the STA-CRM repository
   - Configure base settings:
     - Base directory: (leave blank)
     - Build command: `npm run netlify-build`
     - Publish directory: `.next`
   - Click "Deploy site"

2. **Set Up Branch Deployments:**
   - In Netlify dashboard, navigate to Site Settings > Build & Deploy > Continuous Deployment
   - Enable branch deploys for `staging` and `development`
   - Set "Branch deploy creating URLs with" to "Pretty URLs"

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

## Step 4: Deploy

You can deploy using the included deployment script:

```bash
npm run deploy
```

This interactive script will:
1. Check if you're logged in to Netlify
2. Let you select which environment to deploy to
3. Handle the Git branch switching
4. Build and deploy the application
5. Switch back to your original branch

## Step 5: Verify and Configure Domains

1. **Check Deployment:**
   - Visit the Netlify URL to verify deployment was successful
   - Test functionality with your Supabase backend

2. **Set Up Custom Domain (Optional):**
   - In Netlify dashboard, navigate to Site Settings > Domain Management
   - Add custom domain if desired
   - Configure DNS settings as directed by Netlify

## Ongoing Workflow

1. **Development Flow:**
   - Create feature branches from `development`
   - Develop and test in your feature branch
   - Create PR to merge into `development`
   - Netlify will create a preview deployment for your PR
   - After approval, merge to `development`

2. **Moving to Staging:**
   - Once features are ready in `development`
   - `git checkout staging`
   - `git merge development`
   - `git push origin staging`
   - Netlify will deploy to your staging environment

3. **Moving to Production:**
   - After testing in staging
   - `git checkout main`
   - `git merge staging`
   - `git push origin main`
   - Netlify will deploy to your production environment

## Helpful Commands

- **Deploy to Netlify:**
  ```
  npm run deploy
  ```

- **Initialize Git branches:**
  ```
  npm run setup:branches
  ```

- **Set up Supabase storage:**
  ```
  npm run setup:storage
  ```

- **Deploy directly to production:**
  ```
  npm run netlify-deploy:prod
  ```

See [NETLIFY-DEPLOY.md](./NETLIFY-DEPLOY.md) for more detailed information about the deployment strategy.

## Troubleshooting

**Build Failures:**
- Check Netlify build logs
- Ensure all dependencies are installed
- Verify environment variables are set correctly

**Database Connection Issues:**
- Verify Supabase URL and keys
- Check network connectivity
- Ensure IP restrictions aren't blocking access

**Storage Access Problems:**
- Check bucket policies
- Verify storage permissions
- Ensure correct paths are used in code 
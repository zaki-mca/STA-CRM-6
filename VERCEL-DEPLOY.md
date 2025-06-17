# Vercel Deployment Guide for STA CRM with Supabase

This branch (`vercel-deployment`) contains a version of the STA CRM application that has been adapted for Vercel deployment using Next.js API routes instead of a separate Express server. It is configured to work with Supabase for PostgreSQL database, authentication, and storage.

## Key Changes

1. **API Routes**: Express routes have been converted to Next.js API routes in the `app/api/` directory
2. **Supabase Integration**: Database connection configured to use Supabase PostgreSQL
3. **Storage Support**: Added Supabase storage utilities for file uploads
4. **Middleware**: Added Next.js middleware for CORS and security headers
5. **Scripts**: Added Vercel deployment scripts

## Setup Steps

### 1. Environment Setup

Your Supabase configuration is already set up in `.env.supabase`. For local development, we've created a `.env.local` file with the necessary variables.

For Vercel deployment, you'll need to add these environment variables to your Vercel project settings.

### 2. Database Setup

1. The database schema is already set up in Supabase.
2. To run migrations, you can use the Supabase CLI:

   ```bash
   # Install Supabase CLI if you haven't already
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref dopijdzycdsfyqfbuhwk

   # Apply migrations
   supabase db push
   ```

3. Alternatively, you can run SQL migrations directly from the Supabase dashboard:
   - Go to https://app.supabase.io/project/dopijdzycdsfyqfbuhwk
   - Navigate to the SQL Editor
   - Upload and run your migration SQL files

### 3. Vercel Setup

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. When prompted, configure the following:
   - Set the project name
   - Set the directory to deploy (usually the root)
   - Override the build command? No
   - Override the output directory? No
   - Override the development command? No

5. Add the environment variables in the Vercel dashboard:
   - Navigate to your project settings
   - Go to the "Environment Variables" tab
   - Add all variables from `.env.local` and `.env.supabase` (especially the database connection string and Supabase credentials)

### 4. Configure Supabase Storage (Optional)

If your application uses file uploads:

1. Create storage buckets in Supabase:
   ```bash
   # Using the Supabase client in your app
   npx ts-node scripts/setup-storage.ts
   ```

2. Or manually create buckets:
   - Go to your Supabase dashboard
   - Navigate to "Storage"
   - Click "Create bucket"
   - Set permissions according to your needs

## Working With Both Versions

### Git Branch Strategy

You can switch between the Express server and Next.js API routes versions:

```bash
# Use Vercel-optimized version with Next.js API routes
git checkout vercel-deployment

# Switch back to original Express server version
git checkout main
```

## Testing Locally

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Test the API endpoints:
   ```bash
   # Example: Test the database connection
   curl http://localhost:3000/api/test-db
   ```

## Troubleshooting

If you encounter the "Cannot connect to API server" error:

1. Check your environment variables in Vercel
2. Verify that the Supabase PostgreSQL connection is working
3. Check Vercel function logs for detailed error messages
4. Ensure your Supabase JWT secret is correctly configured for authentication

## Need Help?

If you encounter any issues with deployment:

1. Check the Vercel deployment logs
2. Verify Supabase connection in the Supabase dashboard
3. Test API routes locally using `npm run dev`

## Vercel Dashboard

After deploying, you can monitor your application on the [Vercel Dashboard](https://vercel.com/dashboard).

## Troubleshooting

If you encounter any issues:

1. Check the Vercel deployment logs
2. Test the API routes locally before deploying
3. Verify that your environment variables are correctly set in Vercel
4. Ensure your database is accessible from Vercel's servers 
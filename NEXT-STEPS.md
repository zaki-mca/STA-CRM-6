# Next Steps for STA CRM Vercel Deployment

Congratulations! You've successfully set up your STA CRM project for deployment to Vercel with Supabase as the database. Here are the next steps to complete the deployment process:

## 1. Login to Supabase CLI

```bash
npx supabase login
```

When prompted, get your access token from the Supabase dashboard at: https://app.supabase.com/account/tokens

## 2. Link Your Supabase Project

```bash
npx supabase link --project-ref dopijdzycdsfyqfbuhwk
```

## 3. Push the Database Schema to Supabase

```bash
npx supabase db push
```

This will apply the SQL migrations in the `supabase/migrations` directory to your Supabase database.

## 4. Initialize Supabase Storage Buckets

```bash
npx ts-node scripts/setup-storage.ts
```

This script will create the necessary storage buckets for your application.

## 5. Deploy to Vercel

```bash
# Login to Vercel if you haven't already
npx vercel login

# Deploy to Vercel
npx vercel
```

When prompted, set up the project with the following configuration:
- Set up project with default settings
- Link to existing project? No (create a new project)
- Provide a project name (e.g., sta-crm)
- Use the project root directory (press Enter)
- Override build settings? No (use the ones in your package.json)

## 6. Configure Environment Variables in Vercel

After deployment, go to the Vercel dashboard and configure the following environment variables:

1. Go to your project on the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add all the variables from `.env.local` and `.env.supabase`, especially:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (the Supabase PostgreSQL connection string)
   - `NODE_ENV` (set to "production")
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`

## 7. Redeploy with Environment Variables

```bash
npx vercel --prod
```

This will ensure your application is deployed with all the required environment variables.

## 8. Test Your Deployment

Visit your deployed application URL and test the following:

1. Navigate to different pages to ensure they load correctly
2. Test the API endpoints (e.g., `/api/test-db` to verify database connection)
3. Test client/product creation and management functionality
4. Verify that file uploads work correctly (using Supabase Storage)

## 9. Set Up Custom Domain (Optional)

If you have a custom domain:

1. Go to your project on the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your domain and follow the instructions to configure DNS settings

## 10. Monitor Performance and Errors

1. Use the Vercel dashboard to monitor:
   - Performance metrics
   - Error logs
   - API function execution
   - Deployment history

2. Check Supabase dashboard for:
   - Database performance
   - Storage usage
   - Authentication logs

## 11. Regular Database Backups

Set up regular database backups in Supabase:

1. Go to your Supabase project
2. Navigate to "Database" > "Backups"
3. Configure automated backups

## Need Help?

If you encounter any issues or need assistance, check the following resources:

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

Good luck with your deployment! 
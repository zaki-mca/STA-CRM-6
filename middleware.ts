import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// This middleware handles authentication and environment-specific configurations
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set(name, value, options);
        },
        remove: (name, options) => {
          res.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  
  // Add environment indicator headers for non-production environments
  const siteEnv = process.env.NEXT_PUBLIC_SITE_ENV || 'development';
  if (siteEnv !== 'production') {
    res.headers.set('X-Environment', siteEnv);
  }
  
  // Check auth session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Paths that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
  ];
  
  // API routes don't go through this middleware
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return res;
  }

  // Check if the route is protected
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname);
  
  // Auth logic: Redirect unauthenticated users to login, except for public paths
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Define which paths this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif).*)',
  ],
} 
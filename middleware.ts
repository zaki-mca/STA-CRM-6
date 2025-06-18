import { NextRequest, NextResponse } from 'next/server'

// This middleware handles environment-specific configurations
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Add environment indicator headers for non-production environments
  const siteEnv = process.env.NEXT_PUBLIC_SITE_ENV || 'development';
  if (siteEnv !== 'production') {
    res.headers.set('X-Environment', siteEnv);
  }
  
  return res;
}

// Define which paths this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 
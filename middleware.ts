import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.tradingview.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://*.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://translate.googleapis.com",
      "img-src 'self' blob: data: https://*.supabase.co https://*.tradingview.com https://*.google.com https://www.gstatic.com https://translate.google.com https://translate.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com https://www.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tradingview.com https://translate.googleapis.com https://translate-pa.googleapis.com https://*.google.com",
      "frame-src 'self' https://*.tradingview.com https://*.google.com https://translate.google.com",
    ].join('; '),
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove identifying headers for "untrackable" feel
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Allowed origins for open-redirect protection
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/dashboard/',
  '/auth/',
  '/admin',
  '/admin/',
];

function isSafeRedirectPath(redirect: string | null): boolean {
  if (!redirect) return false;
  try {
    // Must be a relative path, not an absolute URL
    if (redirect.startsWith('http://') || redirect.startsWith('https://') || redirect.startsWith('//')) {
      return false;
    }
    return ALLOWED_REDIRECT_PATHS.some((prefix) => redirect.startsWith(prefix));
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ── Open-Redirect Protection ──────────────────────────────────────
  // Sanitise the `redirect` query parameter to prevent phishing via
  // crafted links like /auth/login?redirect=https://evil.com
  const { searchParams, pathname } = request.nextUrl;
  if (searchParams.has('redirect')) {
    const redirect = searchParams.get('redirect');
    if (redirect && !isSafeRedirectPath(redirect)) {
      const safeUrl = request.nextUrl.clone();
      safeUrl.searchParams.delete('redirect');
      return NextResponse.redirect(safeUrl);
    }
  }

  // ── Security Headers ──────────────────────────────────────────────
  const securityHeaders: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.tradingview.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://*.google.com https://translate-pa.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://translate.googleapis.com",
      "img-src 'self' blob: data: https://*.supabase.co https://*.tradingview.com https://*.google.com https://www.gstatic.com https://translate.google.com https://translate.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tradingview.com https://translate.googleapis.com https://translate-pa.googleapis.com https://*.google.com",
      "frame-src 'self' https://*.tradingview.com https://*.google.com https://translate.google.com",
      "worker-src 'self' blob:",
    ].join('; '),
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove identifying headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
};

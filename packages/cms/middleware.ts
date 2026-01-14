import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Security headers applied to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // CSP: Next.js requires unsafe-inline and unsafe-eval for hydration
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js hydration needs this
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://images.annahalova.cz",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const host = request.headers.get('host') || ''

  // Redirect public routes from CMS domain to main domain
  if (host.startsWith('cms.') && !pathname.startsWith('/admin') && !pathname.startsWith('/api/') && pathname !== '/sitemap.xml') {
    const mainDomain = host.replace('cms.', '')
    return NextResponse.redirect(new URL(pathname, `https://${mainDomain}`), 301)
  }

  // Handle API routes FIRST - no i18n, just security headers
  if (pathname.startsWith('/api/')) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Handle /admin routes - auth protection
  if (pathname.startsWith('/admin')) {
    // Allow login page (with or without trailing slash)
    if (pathname === '/admin/login' || pathname === '/admin/login/') {
      return addSecurityHeaders(NextResponse.next())
    }

    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login/', request.url))
    }

    // Just check token exists - full verification in API routes
    // Note: Middleware can't access Cloudflare env for JWT_SECRET
    // This is a known limitation; all sensitive operations validate in API routes
    return addSecurityHeaders(NextResponse.next())
  }

  // Handle all other routes with i18n middleware
  const response = intlMiddleware(request)
  return addSecurityHeaders(response as NextResponse)
}

export const config = {
  matcher: ['/', '/(cs|en)/:path*', '/admin/:path*', '/api/:path*'],
}

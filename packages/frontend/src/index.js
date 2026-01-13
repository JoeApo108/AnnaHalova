// Simple file-serving Worker
// Serves pre-rendered HTML from R2

// Security headers applied to all responses
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // CSP for static site - allow inline scripts for gallery alignment
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://*.r2.cloudflarestorage.com https://images.annahalova.cz",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// Helper to add security headers to a response
function addSecurityHeaders(response, additionalHeaders = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  for (const [key, value] of Object.entries(additionalHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;

    // Root redirects to Czech
    if (path === '/') {
      return Response.redirect(`${url.origin}/cs`, 302);
    }

    // Images are stored in R2 under images/ prefix
    // e.g., /images/full/001-lava.jpg -> images/full/001-lava.jpg
    if (path.startsWith('/images/')) {
      const imagePath = path.slice(1); // Remove leading '/' only
      const file = await env.R2.get(imagePath);

      if (!file) {
        return addSecurityHeaders(new Response('Image not found', { status: 404 }));
      }

      let contentType = 'image/jpeg';
      if (path.endsWith('.png')) contentType = 'image/png';
      else if (path.endsWith('.webp')) contentType = 'image/webp';
      else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (path.endsWith('.gif')) contentType = 'image/gif';

      return addSecurityHeaders(new Response(file.body), {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
    }

    // Determine file path in R2 for HTML pages
    let r2Path = `site${path}`;

    // Handle directory requests (add index.html)
    if (!path.includes('.')) {
      r2Path = `site${path.replace(/\/$/, '')}/index.html`;
    }

    // Try to get file from R2
    const file = await env.R2.get(r2Path);

    if (!file) {
      // Try with .html extension
      const htmlPath = `site${path}.html`;
      const htmlFile = await env.R2.get(htmlPath);

      if (htmlFile) {
        return addSecurityHeaders(new Response(htmlFile.body), {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60'
        });
      }

      return addSecurityHeaders(new Response('Not Found', { status: 404 }));
    }

    // Determine content type
    let contentType = 'text/html; charset=utf-8';
    if (path.endsWith('.css')) contentType = 'text/css';
    else if (path.endsWith('.js')) contentType = 'application/javascript';
    else if (path.endsWith('.json')) contentType = 'application/json';
    else if (path.endsWith('.webmanifest')) contentType = 'application/manifest+json';
    else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (path.endsWith('.png')) contentType = 'image/png';
    else if (path.endsWith('.webp')) contentType = 'image/webp';
    else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (path.endsWith('.ico')) contentType = 'image/x-icon';

    // Cache images longer
    const cacheControl = contentType.startsWith('image/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=60';

    return addSecurityHeaders(new Response(file.body), {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    });
  }
};

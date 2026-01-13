// API route to serve R2 images
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Map URL prefixes to R2 paths (security: whitelist approach)
const PATH_MAP: Record<string, string> = {
  'originals/': 'originals/',     // /api/images/originals/x.jpg → originals/x.jpg
  'thumbs/': 'images/thumbs/',    // /api/images/thumbs/x.jpg → images/thumbs/x.jpg
  'full/': 'images/full/',        // /api/images/full/x.jpg → images/full/x.jpg
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const urlPath = path.join('/')

  // Security: Block path traversal attacks
  if (urlPath.includes('..') || urlPath.includes('//')) {
    return new Response('Invalid path', { status: 400 })
  }

  // Security: Only allow access to mapped directories
  let r2Path: string | null = null
  for (const [urlPrefix, r2Prefix] of Object.entries(PATH_MAP)) {
    if (urlPath.startsWith(urlPrefix)) {
      r2Path = r2Prefix + urlPath.slice(urlPrefix.length)
      break
    }
  }

  if (!r2Path) {
    return new Response('Access denied', { status: 403 })
  }

  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  try {
    const object = await env.R2.get(r2Path)

    if (!object) {
      return new Response('Image not found', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new Response(object.body, { headers })
  } catch (error) {
    console.error('R2 error:', error)
    return new Response('Error fetching image', { status: 500 })
  }
}

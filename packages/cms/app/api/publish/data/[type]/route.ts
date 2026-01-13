// app/api/publish/data/[type]/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const { type } = await params

  // Only allow specific data types
  const allowedTypes = ['paintings', 'watercolors', 'theme']
  if (!allowedTypes.includes(type)) {
    return Response.json({ error: 'Invalid data type' }, { status: 400 })
  }

  try {
    // Fetch from R2 (updated path for Python Worker)
    const key = type === 'theme' ? 'published/theme.css' : `published/${type}.json`
    const object = await env.R2.get(key)

    if (!object) {
      return Response.json({ error: 'No published data found' }, { status: 404 })
    }

    const data = await object.text()

    // Return appropriate content type
    if (type === 'theme') {
      return new Response(data, {
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=60',
        },
      })
    }

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    // Security: Log detailed error server-side, return generic message
    console.error('Fetch published data error:', error)
    return Response.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

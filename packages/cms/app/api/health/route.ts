// app/api/health/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function GET() {
  try {
    const { env } = getCloudflareContext() as { env: CloudflareEnv }

    // Test D1 connection
    const result = await env.DB.prepare('SELECT 1 as test').first()

    // Security: Minimal public health check - don't leak internal state
    if (!result) {
      throw new Error('Database connection failed')
    }

    return Response.json({ status: 'ok' })
  } catch (error) {
    // Security: Log detailed error, return generic message
    console.error('Health check error:', error)
    return Response.json({
      status: 'error',
      message: 'Service unavailable'
    }, { status: 503 })
  }
}

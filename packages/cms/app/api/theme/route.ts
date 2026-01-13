// app/api/theme/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuth } from '@/lib/auth'
import { themeSettingsSchema, validateRequest } from '@/lib/validation'

// Security: Sanitize CSS values to prevent injection
function sanitizeCSSValue(value: string): string {
  let sanitized = value.replace(/[{}<>;"'`\\]/g, '')
  // Block url() which could load external resources for tracking
  sanitized = sanitized.replace(/url\s*\(/gi, '')
  return sanitized
}

function sanitizeCSSKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9-]/g, '')
}

export async function GET() {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  try {
    const settings = await env.DB.prepare(
      'SELECT key, value, category, label FROM theme_settings ORDER BY category, key'
    ).all()

    return Response.json({ settings: settings.results })
  } catch (error) {
    console.error('Get theme settings error:', error)
    return Response.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Validate input
  const rawData = await request.json()
  const validation = validateRequest(themeSettingsSchema, rawData)
  if (!validation.success) return validation.response

  const { settings } = validation.data

  // Sanitize all values before storing
  const sanitizedSettings = settings.map(s => ({
    key: sanitizeCSSKey(s.key),
    value: sanitizeCSSValue(s.value),
  }))

  try {
    const statements = sanitizedSettings.map(s =>
      env.DB.prepare(
        'UPDATE theme_settings SET value = ?, updated_at = unixepoch() WHERE key = ?'
      ).bind(s.value, s.key)
    )

    await env.DB.batch(statements)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Update theme settings error:', error)
    return Response.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

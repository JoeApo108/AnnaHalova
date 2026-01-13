import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuth, hashPassword, verifyPassword } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { changePasswordSchema, validateRequest } from '@/lib/validation'

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Rate limiting: 3 attempts per hour per user
  const rateLimit = checkRateLimit(user.id, 'passwordChange')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit)
  }

  // Validate input with enhanced password requirements
  const rawData = await request.json()
  const validation = validateRequest(changePasswordSchema, rawData)
  if (!validation.success) return validation.response

  const { currentPassword, newPassword } = validation.data

  // Get current user's password hash
  const dbUser = await env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(user.id).first<{ password_hash: string }>()

  if (!dbUser) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, dbUser.password_hash)
  if (!isValid) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  // Hash and save new password
  const newHash = await hashPassword(newPassword)
  await env.DB.prepare(
    'UPDATE users SET password_hash = ? WHERE id = ?'
  ).bind(newHash, user.id).run()

  return Response.json({ success: true })
}

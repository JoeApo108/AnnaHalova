import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuth, hashPassword, verifyPassword, createToken, logAuthEvent } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { changePasswordSchema, validateRequest } from '@/lib/validation'

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Rate limiting: 3 attempts per hour per user
  const rateLimit = await checkRateLimit(env, user.id, 'passwordChange')
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

  // Hash and save new password. Bump token_version to revoke all existing sessions.
  const newHash = await hashPassword(newPassword)
  const updated = await env.DB.prepare(
    'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ? RETURNING token_version'
  ).bind(newHash, user.id).first<{ token_version: number }>()

  await logAuthEvent(env, 'password_change', { email: user.email, userId: user.id })

  // Re-mint the current session so the user stays logged in here while every
  // other session is invalidated by the bumped token_version.
  const token = await createToken({ id: user.id, role: user.role, tv: updated?.token_version ?? 0 }, env.JWT_SECRET)

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=14400`,
      },
    }
  )
}

// app/api/auth/login/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyPassword, createToken, logAuthEvent } from '@/lib/auth'
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import { loginSchema, validateRequest } from '@/lib/validation'

// Fixed hash to equalize timing when the email doesn't exist (prevents user enumeration)
const DUMMY_HASH = '$2b$10$dDjaynoRh/2juBC4eIkKjukKgrLUMwSqJ6pCkE1nYzNbBiZPWimMW'

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  // Rate limiting: 5 attempts per minute per IP
  const clientIP = getClientIP(request)
  const rateLimit = await checkRateLimit(env, clientIP, 'login')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit)
  }

  // Validate input
  const rawData = await request.json()
  const validation = validateRequest(loginSchema, rawData)
  if (!validation.success) return validation.response

  const { email, password } = validation.data

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<{ id: string; email: string; name: string; role: string; password_hash: string; token_version: number }>()

  // Always run bcrypt (against a dummy hash when no user) so response timing
  // doesn't reveal whether the email exists
  const validPassword = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH)

  if (!user || !validPassword) {
    await logAuthEvent(env, 'login_failure', { email, ip: clientIP })
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await createToken(
    { id: user.id, role: user.role, tv: user.token_version },
    env.JWT_SECRET
  )

  await logAuthEvent(env, 'login_success', { email: user.email, userId: user.id, ip: clientIP })

  await env.DB.prepare(
    'UPDATE users SET last_login = unixepoch() WHERE id = ?'
  ).bind(user.id).run()

  return new Response(
    JSON.stringify({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=14400`
      }
    }
  )
}

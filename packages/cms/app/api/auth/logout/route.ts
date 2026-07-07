// app/api/auth/logout/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCookie, verifySession, bumpTokenVersion, logAuthEvent } from '@/lib/auth'

const CLEAR_COOKIE = 'auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  // If the cookie is a valid session, revoke it server-side (invalidates all sessions)
  const user = await verifySession(getCookie(request, 'auth_token'), env)
  if (user) {
    await bumpTokenVersion(env, user.id)
    await logAuthEvent(env, 'logout', { email: user.email, userId: user.id })
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': CLEAR_COOKIE,
      },
    }
  )
}

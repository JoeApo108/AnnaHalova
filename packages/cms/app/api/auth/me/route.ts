// app/api/auth/me/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)

  if (user instanceof Response) return user

  return Response.json({ user })
}

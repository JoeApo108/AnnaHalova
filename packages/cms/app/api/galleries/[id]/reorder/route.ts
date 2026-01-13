import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/galleries/[id]/reorder/route.ts
import { requireAuth } from '@/lib/auth'
import { galleryReorderSchema, validateRequest } from '@/lib/validation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  const { id } = await params

  // Validate input
  const rawData = await request.json()
  const validation = validateRequest(galleryReorderSchema, rawData)
  if (!validation.success) return validation.response

  const { items } = validation.data

  try {
    // Update positions in batch
    const statements = items.map((item) =>
      env.DB.prepare(`
        UPDATE gallery_items SET position = ?
        WHERE gallery_id = ? AND artwork_id = ?
      `).bind(item.position, id, item.id)
    )

    await env.DB.batch(statements)

    // Mark gallery as updated
    await env.DB.prepare(
      'UPDATE galleries SET updated_at = unixepoch() WHERE id = ?'
    ).bind(id).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('Reorder gallery error:', error)
    return Response.json({ error: 'Failed to reorder gallery' }, { status: 500 })
  }
}

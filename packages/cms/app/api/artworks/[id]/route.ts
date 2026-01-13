import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/artworks/[id]/route.ts
// Security: GET is intentionally public (serves published portfolio data)
// PUT/DELETE require authentication
import { requireAuth } from '@/lib/auth'
import { artworkUpdateSchema, validateRequest } from '@/lib/validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const { id } = await params

  try {
    const artwork = await env.DB.prepare(
      'SELECT * FROM artworks WHERE id = ?'
    ).bind(id).first()

    if (!artwork) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const galleries = await env.DB.prepare(`
      SELECT g.id, g.name_cs, g.name_en, g.slug
      FROM galleries g
      JOIN gallery_items gi ON gi.gallery_id = g.id
      WHERE gi.artwork_id = ?
    `).bind(id).all()

    return Response.json({ ...artwork, galleries: galleries.results })
  } catch (error) {
    console.error('Get artwork error:', error)
    return Response.json({ error: 'Failed to load artwork' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  const { id } = await params

  // Validate input
  const rawData = await request.json()
  const validation = validateRequest(artworkUpdateSchema, { ...rawData, id })
  if (!validation.success) return validation.response

  const data = validation.data

  try {
    await env.DB.prepare(`
      UPDATE artworks SET
        title_cs = ?, title_en = ?, medium_cs = ?, medium_en = ?,
        dimensions = ?, year = ?, status = ?, category = ?,
        updated_at = unixepoch()
      WHERE id = ?
    `).bind(
      data.title_cs,
      data.title_en,
      data.medium_cs || '',
      data.medium_en || '',
      data.dimensions || '',
      data.year,
      data.status || 'available',
      data.category,
      id
    ).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('Update artwork error:', error)
    return Response.json({ error: 'Failed to update artwork' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  const { id } = await params

  try {
    await env.DB.prepare('DELETE FROM gallery_items WHERE artwork_id = ?').bind(id).run()
    await env.DB.prepare('DELETE FROM artworks WHERE id = ?').bind(id).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete artwork error:', error)
    return Response.json({ error: 'Failed to delete artwork' }, { status: 500 })
  }
}

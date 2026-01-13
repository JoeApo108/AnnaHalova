import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/galleries/[id]/route.ts
// Security: GET is intentionally public (serves published portfolio data)
// PUT/DELETE require authentication
import { requireAuth } from '@/lib/auth'
import { galleryUpdateSchema, validateRequest } from '@/lib/validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const { id } = await params

  try {
    const gallery = await env.DB.prepare(
      'SELECT * FROM galleries WHERE id = ?'
    ).bind(id).first()

    if (!gallery) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const items = await env.DB.prepare(`
      SELECT a.*, gi.position
      FROM gallery_items gi
      JOIN artworks a ON a.id = gi.artwork_id
      WHERE gi.gallery_id = ?
      ORDER BY gi.position
    `).bind(id).all()

    // Build thumbnail_url for each item (use thumbs for faster loading)
    interface ArtworkRow {
      id: string
      filename: string
      [key: string]: unknown
    }
    const itemsWithThumbnails = (items.results as ArtworkRow[]).map(item => ({
      ...item,
      thumbnail_url: item.filename ? `/api/images/thumbs/${item.filename}` : null
    }))

    return Response.json({ ...gallery, items: itemsWithThumbnails })
  } catch (error) {
    console.error('Get gallery error:', error)
    return Response.json({ error: 'Failed to load gallery' }, { status: 500 })
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
  const validation = validateRequest(galleryUpdateSchema, rawData)
  if (!validation.success) return validation.response

  const data = validation.data

  try {
    await env.DB.prepare(`
      UPDATE galleries SET
        name_cs = ?, name_en = ?, is_visible = ?, sort_order = ?,
        updated_at = unixepoch()
      WHERE id = ?
    `).bind(
      data.name_cs,
      data.name_en,
      data.is_visible ? 1 : 0,
      data.sort_order || 0,
      id
    ).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('Update gallery error:', error)
    return Response.json({ error: 'Failed to update gallery' }, { status: 500 })
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
    // Get gallery info before deleting (for deletion log)
    const gallery = await env.DB.prepare(
      'SELECT name_cs, type FROM galleries WHERE id = ?'
    ).bind(id).first<{ name_cs: string; type: string }>()

    if (!gallery) {
      return Response.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Log the deletion for publish tracking
    await env.DB.prepare(`
      INSERT INTO deletion_log (id, item_type, item_id, item_name)
      VALUES (?, 'gallery', ?, ?)
    `).bind(crypto.randomUUID(), id, gallery.name_cs).run()

    // Delete gallery items and gallery
    await env.DB.prepare('DELETE FROM gallery_items WHERE gallery_id = ?').bind(id).run()
    await env.DB.prepare('DELETE FROM galleries WHERE id = ?').bind(id).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete gallery error:', error)
    return Response.json({ error: 'Failed to delete gallery' }, { status: 500 })
  }
}

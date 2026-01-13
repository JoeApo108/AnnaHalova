import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for artworkId
const artworkIdSchema = z.object({
  artworkId: z.string().min(1).max(8).regex(/^[a-zA-Z0-9-]+$/, 'Invalid artwork ID format'),
})

// POST - Add artwork to gallery
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  const { id: galleryId } = await params

  // Validate input
  const rawData = await request.json()
  const validation = artworkIdSchema.safeParse(rawData)
  if (!validation.success) {
    return Response.json({ error: 'Invalid artwork ID' }, { status: 400 })
  }

  const { artworkId } = validation.data

  // Get max position in gallery
  const maxPos = await env.DB.prepare(
    'SELECT MAX(position) as max FROM gallery_items WHERE gallery_id = ?'
  ).bind(galleryId).first<{ max: number | null }>()

  const position = (maxPos?.max || 0) + 1
  const itemId = crypto.randomUUID()

  try {
    // Get gallery info to check if it's a year gallery
    const gallery = await env.DB.prepare(
      'SELECT type, year FROM galleries WHERE id = ?'
    ).bind(galleryId).first<{ type: string; year: number | null }>()

    await env.DB.prepare(`
      INSERT INTO gallery_items (id, gallery_id, artwork_id, position)
      VALUES (?, ?, ?, ?)
    `).bind(itemId, galleryId, artworkId, position).run()

    // If it's a year gallery, update the artwork's year to match
    if (gallery?.type === 'year' && gallery.year) {
      await env.DB.prepare(
        'UPDATE artworks SET year = ? WHERE id = ?'
      ).bind(gallery.year, artworkId).run()
    }

    // Update gallery timestamp
    await env.DB.prepare(
      'UPDATE galleries SET updated_at = unixepoch() WHERE id = ?'
    ).bind(galleryId).run()

    return Response.json({ success: true, id: itemId, position, yearUpdated: gallery?.type === 'year' })
  } catch (error) {
    // Security: Log detailed error server-side, return generic message
    console.error('Add gallery item error:', error)
    if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
      return Response.json({ error: 'Artwork already in gallery' }, { status: 409 })
    }
    return Response.json({ error: 'Failed to add artwork to gallery' }, { status: 500 })
  }
}

// DELETE - Remove artwork from gallery
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  const { id: galleryId } = await params

  // Validate input
  const rawData = await request.json()
  const validation = artworkIdSchema.safeParse(rawData)
  if (!validation.success) {
    return Response.json({ error: 'Invalid artwork ID' }, { status: 400 })
  }

  const { artworkId } = validation.data

  try {
    await env.DB.prepare(`
      DELETE FROM gallery_items WHERE gallery_id = ? AND artwork_id = ?
    `).bind(galleryId, artworkId).run()

    // Update gallery timestamp
    await env.DB.prepare(
      'UPDATE galleries SET updated_at = unixepoch() WHERE id = ?'
    ).bind(galleryId).run()

    return Response.json({ success: true })
  } catch (error) {
    console.error('Remove gallery item error:', error)
    return Response.json({ error: 'Failed to remove artwork from gallery' }, { status: 500 })
  }
}

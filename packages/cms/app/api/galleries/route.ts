import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/galleries/route.ts
// Security: GET is intentionally public (serves published portfolio data)
// POST requires authentication
import { requireAuth } from '@/lib/auth'
import { galleryCreateSchema, validateRequest } from '@/lib/validation'

export async function GET(_request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  try {
    const galleries = await env.DB.prepare(`
      SELECT g.*, COUNT(gi.id) as item_count
      FROM galleries g
      LEFT JOIN gallery_items gi ON gi.gallery_id = g.id
      GROUP BY g.id
      ORDER BY g.sort_order, g.year DESC, g.name_cs
    `).all()

    return Response.json({ galleries: galleries.results })
  } catch (error) {
    console.error('Get galleries error:', error)
    return Response.json({ error: 'Failed to load galleries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Validate input
  const rawData = await request.json()
  const validation = validateRequest(galleryCreateSchema, rawData)
  if (!validation.success) return validation.response

  const data = validation.data
  const id = crypto.randomUUID()
  const slug = data.slug || `${data.type}-${Date.now()}`

  try {
    await env.DB.prepare(`
      INSERT INTO galleries (id, slug, type, name_cs, name_en, category, year, series_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      slug,
      data.type,
      data.name_cs,
      data.name_en,
      data.category || null,
      data.year || null,
      data.series_key || null
    ).run()

    return Response.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error('Create gallery error:', error)
    return Response.json({ error: 'Failed to create gallery' }, { status: 500 })
  }
}

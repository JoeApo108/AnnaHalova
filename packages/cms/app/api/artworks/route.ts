import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/artworks/route.ts
// Security: GET is intentionally public (serves published portfolio data)
// POST/PUT/DELETE require authentication
import { requireAuth } from '@/lib/auth'
import { artworkCreateSchema, validateRequest } from '@/lib/validation'

interface ArtworkRow {
  id: string
  filename: string
  title_cs: string
  title_en: string
  image_url?: string
  year: number
  category: string
  status: string
}

// Normalize string: remove diacritics (háčky, čárky) for accent-insensitive search
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export async function GET(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const url = new URL(request.url)

  const category = url.searchParams.get('category')
  const year = url.searchParams.get('year')
  const search = url.searchParams.get('search')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = 20

  // Build query with category/year filters (search handled in JS for accent-insensitive matching)
  let query = 'SELECT * FROM artworks WHERE 1=1'
  const params: (string | number)[] = []

  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }
  if (year) {
    query += ' AND year = ?'
    params.push(parseInt(year))
  }

  query += ' ORDER BY year DESC, id DESC'

  const allArtworks = await env.DB.prepare(query).bind(...params).all()

  // Filter by search in JS (accent-insensitive)
  let filtered = allArtworks.results as ArtworkRow[]
  if (search) {
    const normalizedSearch = normalize(search)
    filtered = filtered.filter((a) =>
      normalize(a.title_cs || '').includes(normalizedSearch) ||
      normalize(a.title_en || '').includes(normalizedSearch)
    )
  }

  // Paginate
  const total = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  return Response.json({
    artworks: paginated.map((a) => ({
      ...a,
      thumbnail_url: a.filename ? `/api/images/thumbs/${a.filename}` : null
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Validate input
  const rawData = await request.json()
  const validation = validateRequest(artworkCreateSchema, rawData)
  if (!validation.success) return validation.response

  const data = validation.data
  const id = data.id || crypto.randomUUID().slice(0, 8)

  try {
    await env.DB.prepare(`
      INSERT INTO artworks (
        id, filename, image_url, title_cs, title_en, medium_cs, medium_en,
        dimensions, year, category, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.filename,
      data.image_url || null,
      data.title_cs,
      data.title_en,
      data.medium_cs,
      data.medium_en,
      data.dimensions,
      data.year,
      data.category,
      data.status
    ).run()

    return Response.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error('Create artwork error:', error)
    return Response.json({ error: 'Failed to create artwork' }, { status: 500 })
  }
}

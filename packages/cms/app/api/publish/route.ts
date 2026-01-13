import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/publish/route.ts
import { requireAuth } from '@/lib/auth'
import { generateAllPages, setThemeCSS, PaintingsData, WatercolorsData, AboutData, ContactData } from '@/lib/renderer'
import { publishSchema, validateRequest } from '@/lib/validation'
import aboutData from '@/data/about.json'
import contactData from '@/data/contact.json'

interface ArtworkRow {
  id: string
  filename: string
  title_cs: string
  title_en: string
  medium_cs: string
  medium_en: string
  dimensions: string
  year: number
  status: string
}

interface GalleryRow {
  id: string
  slug: string
  name_cs: string
  name_en: string
  series_key?: string
  year?: number
  item_count?: number
}

interface CarouselRow {
  filename: string
  title_cs: string
  title_en: string
}

interface ThemeSettingRow {
  key: string
  value: string
}

interface AuthUser {
  id: string
  role: string
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Validate publish request body
  const rawData = await request.json().catch(() => ({ notes: '' }))
  const validation = validateRequest(publishSchema, rawData)
  if (!validation.success) return validation.response
  const { notes } = validation.data

  const publishId = crypto.randomUUID()

  try {
    // 1. Generate static data
    const paintingsData = await generatePaintingsData(env)
    const watercolorsData = await generateWatercolorsData(env)
    const themeCSS = await generateThemeCSS(env)

    // 2. Upload JSON to R2 for debugging/API
    await Promise.all([
      env.R2.put('published/paintings.json', JSON.stringify(paintingsData)),
      env.R2.put('published/watercolors.json', JSON.stringify(watercolorsData)),
      env.R2.put('published/theme.css', themeCSS)
    ])

    // 3. Set theme CSS before generating pages
    setThemeCSS(themeCSS)

    // 4. Generate all HTML pages
    const pages = generateAllPages(
      paintingsData as PaintingsData,
      watercolorsData as WatercolorsData,
      aboutData as AboutData,
      contactData as ContactData
    )

    // 5. Clean up old site files from R2 (removes deleted galleries)
    // Preserve static assets (favicons, manifest) that don't change
    const preserveFiles = new Set([
      'site/favicon.ico',
      'site/favicon.svg',
      'site/apple-touch-icon.png',
      'site/site.webmanifest'
    ])
    const oldFiles = await env.R2.list({ prefix: 'site/' })
    if (oldFiles.objects.length > 0) {
      const filesToDelete = oldFiles.objects.filter(
        (obj: { key: string }) => !preserveFiles.has(obj.key)
      )
      await Promise.all(
        filesToDelete.map((obj: { key: string }) => env.R2.delete(obj.key))
      )
      console.log(`Deleted ${filesToDelete.length} old HTML files from R2 (preserved ${preserveFiles.size} static assets)`)
    }

    // 6. Upload all pages to R2 (HTML and robots.txt)
    const uploadPromises = Object.entries(pages).map(([path, content]) => {
      // Set correct content type based on file extension
      const contentType = path.endsWith('.txt')
        ? 'text/plain; charset=utf-8'
        : 'text/html; charset=utf-8';
      return env.R2.put(`site/${path}`, content, {
        httpMetadata: { contentType }
      });
    })

    await Promise.all(uploadPromises)

    console.log(`Published ${Object.keys(pages).length} HTML pages to R2`)

    // 7. Save published snapshots for discard feature
    await savePublishedSnapshots(env)

    // 8. Log success
    await env.DB.prepare(`
      INSERT INTO publish_log (id, published_by, status, notes)
      VALUES (?, ?, 'success', ?)
    `).bind(publishId, (user as AuthUser).id, notes).run()

    // 9. Mark deletions as published
    await env.DB.prepare(`
      UPDATE deletion_log SET published_at = unixepoch() WHERE published_at IS NULL
    `).run()

    return Response.json({
      success: true,
      message: 'Published! Changes are now live on the website.'
    })

  } catch (error) {
    // Security: Log detailed error server-side, return generic message to client
    console.error('Publish error:', error)

    // Log failure (store error details in database for admin review)
    await env.DB.prepare(`
      INSERT INTO publish_log (id, published_by, status, notes)
      VALUES (?, ?, 'failed', ?)
    `).bind(publishId, (user as AuthUser).id, String(error)).run()

    return Response.json({
      success: false,
      error: 'Publish failed. Please try again or contact support.'
    }, { status: 500 })
  }
}

async function generatePaintingsData(env: CloudflareEnv) {
  // Get painting year galleries (artworks shown based on gallery assignment, not category)
  const yearGalleries = await env.DB.prepare(`
    SELECT g.*
    FROM galleries g
    WHERE g.category = 'painting' AND g.type = 'year'
    ORDER BY g.year DESC
  `).all()

  // Build years array from galleries
  const years = []
  for (const gallery of yearGalleries.results as GalleryRow[]) {
    const items = await env.DB.prepare(`
      SELECT a.*
      FROM gallery_items gi
      JOIN artworks a ON a.id = gi.artwork_id
      WHERE gi.gallery_id = ?
      ORDER BY gi.position
    `).bind(gallery.id).all()

    if (items.results.length > 0) {
      years.push({
        year: gallery.year,
        artworks: (items.results as ArtworkRow[]).map(a => ({
          id: a.id,
          filename: a.filename,
          title: { cs: a.title_cs, en: a.title_en },
          medium: { cs: a.medium_cs, en: a.medium_en },
          dimensions: a.dimensions,
          year: a.year,
          ...(a.status !== 'available' && { status: a.status })
        }))
      })
    }
  }

  // Get carousel items
  const carousel = await env.DB.prepare(`
    SELECT a.filename, a.title_cs, a.title_en
    FROM gallery_items gi
    JOIN artworks a ON a.id = gi.artwork_id
    JOIN galleries g ON g.id = gi.gallery_id
    WHERE g.slug = 'carousel'
    ORDER BY gi.position
  `).all()

  // Get featured items
  const featured = await env.DB.prepare(`
    SELECT a.*
    FROM gallery_items gi
    JOIN artworks a ON a.id = gi.artwork_id
    JOIN galleries g ON g.id = gi.gallery_id
    WHERE g.slug = 'featured'
    ORDER BY gi.position
  `).all()

  return {
    carousel: (carousel.results as CarouselRow[]).map(c => ({
      filename: c.filename,
      alt: { cs: c.title_cs, en: c.title_en }
    })),
    featured: (featured.results as ArtworkRow[]).map(f => ({
      id: f.id,
      filename: f.filename,
      title: { cs: f.title_cs, en: f.title_en },
      medium: { cs: f.medium_cs, en: f.medium_en },
      dimensions: f.dimensions,
      year: f.year,
      ...(f.status !== 'available' && { status: f.status })
    })),
    years
  }
}

async function generateWatercolorsData(env: CloudflareEnv) {
  // Get all watercolor series galleries
  const seriesGalleries = await env.DB.prepare(`
    SELECT g.*,
      (SELECT COUNT(*) FROM gallery_items WHERE gallery_id = g.id) as item_count
    FROM galleries g
    WHERE g.category = 'watercolor' AND g.type = 'series'
    ORDER BY g.sort_order
  `).all()

  const series = []
  for (const gallery of seriesGalleries.results as GalleryRow[]) {
    const items = await env.DB.prepare(`
      SELECT a.*
      FROM gallery_items gi
      JOIN artworks a ON a.id = gi.artwork_id
      WHERE gi.gallery_id = ?
      ORDER BY gi.position
    `).bind(gallery.id).all()

    series.push({
      id: gallery.series_key || gallery.slug,
      title: { cs: gallery.name_cs, en: gallery.name_en },
      year: gallery.year,
      preview: (items.results as ArtworkRow[]).slice(0, 3).map(a => a.filename),
      artworks: (items.results as ArtworkRow[]).map(a => ({
        id: a.id,
        filename: a.filename,
        title: { cs: a.title_cs || '', en: a.title_en || '' },
        medium: { cs: a.medium_cs, en: a.medium_en },
        dimensions: a.dimensions || '',
        year: a.year
      }))
    })
  }

  return { series }
}

// Security: Sanitize CSS values to prevent injection attacks
function sanitizeCSSValue(value: string): string {
  let sanitized = value.replace(/[{}<>;"'`\\]/g, '')
  // Block url() which could load external resources for tracking
  sanitized = sanitized.replace(/url\s*\(/gi, '')
  return sanitized
}

function sanitizeCSSKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9-]/g, '')
}

async function generateThemeCSS(env: CloudflareEnv) {
  const settings = await env.DB.prepare('SELECT key, value FROM theme_settings').all()
  const cssVars = (settings.results as ThemeSettingRow[])
    .map(s => `  --${sanitizeCSSKey(s.key)}: ${sanitizeCSSValue(s.value)};`)
    .join('\n')
  return `:root {\n${cssVars}\n}`
}

// Save snapshots of current state for the discard feature
async function savePublishedSnapshots(env: CloudflareEnv) {
  // Save gallery snapshots (including their artwork assignments)
  const galleries = await env.DB.prepare(`
    SELECT id, slug, type, name_cs, name_en, description_cs, description_en,
           category, year, series_key, is_visible, sort_order
    FROM galleries
  `).all()

  for (const gallery of galleries.results as GalleryRow[]) {
    // Get artwork IDs assigned to this gallery
    const items = await env.DB.prepare(`
      SELECT artwork_id FROM gallery_items WHERE gallery_id = ? ORDER BY position
    `).bind(gallery.id).all()

    const artworkIds = (items.results as { artwork_id: string }[]).map(i => i.artwork_id)

    const snapshot = JSON.stringify({
      slug: gallery.slug,
      type: (gallery as unknown as { type: string }).type,
      name_cs: gallery.name_cs,
      name_en: gallery.name_en,
      description_cs: (gallery as unknown as { description_cs: string }).description_cs,
      description_en: (gallery as unknown as { description_en: string }).description_en,
      category: (gallery as unknown as { category: string }).category,
      year: gallery.year,
      series_key: gallery.series_key,
      is_visible: (gallery as unknown as { is_visible: number }).is_visible,
      sort_order: (gallery as unknown as { sort_order: number }).sort_order,
      artwork_ids: artworkIds
    })

    await env.DB.prepare(`
      UPDATE galleries SET published_snapshot = ? WHERE id = ?
    `).bind(snapshot, gallery.id).run()
  }

  // Save theme setting snapshots
  const themeSettings = await env.DB.prepare('SELECT key, value FROM theme_settings').all()

  for (const setting of themeSettings.results as ThemeSettingRow[]) {
    const snapshot = JSON.stringify({ value: setting.value })
    await env.DB.prepare(`
      UPDATE theme_settings SET published_snapshot = ? WHERE key = ?
    `).bind(snapshot, setting.key).run()
  }

  console.log(`Saved snapshots for ${galleries.results.length} galleries and ${themeSettings.results.length} theme settings`)
}

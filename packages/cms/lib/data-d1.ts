// D1 Database data access layer for public pages
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { Artwork, WatercolorSeries, CarouselSlide, PaintingYear } from '@/data/types'

type Locale = 'cs' | 'en'

// Helper functions (same as in data.ts)
export function getLocalizedText<T extends { cs: string; en: string }>(
  obj: T,
  locale: Locale
): string {
  return obj[locale] || obj.cs
}

export function getMediumLabel(medium: Artwork['medium'], locale: Locale): string {
  return medium[locale] || medium.cs
}

export function getStatusLabel(status: Artwork['status'], locale: Locale): string | null {
  if (!status) return null
  const labels: Record<NonNullable<Artwork['status']>, Record<Locale, string>> = {
    sold: { cs: 'PRODÁNO', en: 'SOLD' },
    donated: { cs: 'VĚNOVÁNO', en: 'DONATED' },
  }
  return labels[status][locale]
}

// Database row types
interface ArtworkRow {
  id: string
  filename: string
  title_cs: string
  title_en: string
  medium_cs: string
  medium_en: string
  dimensions: string
  year: number
  status: string | null
  category: string
  image_url: string | null
}

interface GalleryRow {
  id: string
  slug: string
  type: string
  name_cs: string
  name_en: string
  category: string
  year: number | null
  series_key: string | null
  is_visible: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _GalleryItemRow {
  artwork_id: string
  sort_order: number
}

// Transform database row to Artwork type
function rowToArtwork(row: ArtworkRow): Artwork {
  return {
    id: row.id,
    filename: row.image_url || row.filename,
    title: {
      cs: row.title_cs,
      en: row.title_en,
    },
    medium: {
      cs: row.medium_cs,
      en: row.medium_en,
    },
    dimensions: row.dimensions || '',
    year: row.year,
    status: row.status === 'sold' || row.status === 'donated' ? row.status : undefined,
  }
}

// Get D1 database instance
function getDB() {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  return env.DB
}

// Carousel slides from gallery
export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  const db = getDB()

  type CarouselRow = { filename: string; image_url: string | null; title_cs: string; title_en: string }
  const items = await db.prepare(`
    SELECT a.filename, a.image_url, a.title_cs, a.title_en
    FROM gallery_items gi
    JOIN artworks a ON gi.artwork_id = a.id
    JOIN galleries g ON gi.gallery_id = g.id
    WHERE g.type = 'carousel' AND g.is_visible = 1
    ORDER BY gi.position
  `).all<CarouselRow>()

  return items.results.map((row: CarouselRow) => ({
    filename: row.image_url || row.filename,
    alt: {
      cs: row.title_cs,
      en: row.title_en,
    },
  }))
}

// Featured paintings from gallery
export async function getFeaturedPaintings(): Promise<Artwork[]> {
  const db = getDB()

  const items = await db.prepare(`
    SELECT a.*
    FROM gallery_items gi
    JOIN artworks a ON gi.artwork_id = a.id
    JOIN galleries g ON gi.gallery_id = g.id
    WHERE g.type = 'featured' AND g.is_visible = 1
    ORDER BY gi.position
  `).all<ArtworkRow>()

  return items.results.map(rowToArtwork)
}

// Get distinct years for paintings
export async function getPaintingYears(): Promise<number[]> {
  const db = getDB()

  type YearRow = { year: number }
  const years = await db.prepare(`
    SELECT DISTINCT g.year
    FROM galleries g
    WHERE g.type = 'year' AND g.category = 'painting' AND g.is_visible = 1 AND g.year IS NOT NULL
    ORDER BY g.year DESC
  `).all<YearRow>()

  return years.results.map((r: YearRow) => r.year)
}

// Get paintings by year
export async function getPaintingsByYear(year: number): Promise<Artwork[]> {
  const db = getDB()

  const items = await db.prepare(`
    SELECT a.*
    FROM gallery_items gi
    JOIN artworks a ON gi.artwork_id = a.id
    JOIN galleries g ON gi.gallery_id = g.id
    WHERE g.type = 'year' AND g.category = 'painting' AND g.year = ?
    ORDER BY gi.position
  `).bind(year).all<ArtworkRow>()

  return items.results.map(rowToArtwork)
}

// Get all watercolor series
export async function getWatercolorSeries(): Promise<WatercolorSeries[]> {
  const db = getDB()

  const galleries = await db.prepare(`
    SELECT g.*,
      (SELECT GROUP_CONCAT(a.filename)
       FROM gallery_items gi
       JOIN artworks a ON gi.artwork_id = a.id
       WHERE gi.gallery_id = g.id
       ORDER BY gi.position
       LIMIT 3) as preview_files
    FROM galleries g
    WHERE g.type = 'series' AND g.category = 'watercolor' AND g.is_visible = 1
    ORDER BY g.sort_order
  `).all<GalleryRow & { preview_files: string | null }>()

  const series: WatercolorSeries[] = []

  for (const gallery of galleries.results) {
    const items = await db.prepare(`
      SELECT a.*
      FROM gallery_items gi
      JOIN artworks a ON gi.artwork_id = a.id
      WHERE gi.gallery_id = ?
      ORDER BY gi.position
    `).bind(gallery.id).all<ArtworkRow>()

    series.push({
      id: gallery.series_key || gallery.slug,
      title: {
        cs: gallery.name_cs,
        en: gallery.name_en,
      },
      year: gallery.year || 2025,
      preview: gallery.preview_files?.split(',').slice(0, 3) || [],
      artworks: items.results.map(rowToArtwork),
    })
  }

  return series
}

// Get watercolor series by ID
export async function getWatercolorSeriesById(id: string): Promise<WatercolorSeries | undefined> {
  const db = getDB()

  const gallery = await db.prepare(`
    SELECT g.*
    FROM galleries g
    WHERE (g.series_key = ? OR g.slug = ? OR g.id = ?)
      AND g.type = 'series' AND g.category = 'watercolor' AND g.is_visible = 1
    LIMIT 1
  `).bind(id, id, `watercolors-${id}`).first<GalleryRow>()

  if (!gallery) return undefined

  const items = await db.prepare(`
    SELECT a.*
    FROM gallery_items gi
    JOIN artworks a ON gi.artwork_id = a.id
    WHERE gi.gallery_id = ?
    ORDER BY gi.position
  `).bind(gallery.id).all<ArtworkRow>()

  type PreviewRow = { filename: string; image_url: string | null }
  const previewItems = await db.prepare(`
    SELECT a.filename, a.image_url
    FROM gallery_items gi
    JOIN artworks a ON gi.artwork_id = a.id
    WHERE gi.gallery_id = ?
    ORDER BY gi.position
    LIMIT 3
  `).bind(gallery.id).all<PreviewRow>()

  return {
    id: gallery.series_key || gallery.slug,
    title: {
      cs: gallery.name_cs,
      en: gallery.name_en,
    },
    year: gallery.year || 2025,
    preview: previewItems.results.map((r: PreviewRow) => r.image_url || r.filename),
    artworks: items.results.map(rowToArtwork),
  }
}

// Get all painting years with artworks (for generateStaticParams replacement)
export async function getAllPaintingYearsWithArtworks(): Promise<PaintingYear[]> {
  const db = getDB()

  const galleries = await db.prepare(`
    SELECT g.*
    FROM galleries g
    WHERE g.type = 'year' AND g.category = 'painting' AND g.is_visible = 1 AND g.year IS NOT NULL
    ORDER BY g.year DESC
  `).all<GalleryRow>()

  const years: PaintingYear[] = []

  for (const gallery of galleries.results) {
    const items = await db.prepare(`
      SELECT a.*
      FROM gallery_items gi
      JOIN artworks a ON gi.artwork_id = a.id
      WHERE gi.gallery_id = ?
      ORDER BY gi.position
    `).bind(gallery.id).all<ArtworkRow>()

    if (gallery.year) {
      years.push({
        year: gallery.year,
        artworks: items.results.map(rowToArtwork),
      })
    }
  }

  return years
}

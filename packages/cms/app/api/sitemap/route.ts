// app/api/sitemap/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://annahalova-demo.pages.dev'

interface Artwork {
  id: string
  year: number
  category: string
  updated_at: number
}

interface Gallery {
  id: string
  slug: string
  type: string
  category: string
  year: number | null
  series_key: string | null
  updated_at: number
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0]
}

export async function GET() {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  // Fetch all artworks and galleries
  const [artworksResult, galleriesResult] = await Promise.all([
    env.DB.prepare('SELECT id, year, category, updated_at FROM artworks').all<Artwork>(),
    env.DB.prepare('SELECT id, slug, type, category, year, series_key, updated_at FROM galleries WHERE is_visible = 1').all<Gallery>(),
  ])

  const artworks = artworksResult.results || []
  const galleries = galleriesResult.results || []

  // Get latest update timestamp
  const latestUpdate = Math.max(
    ...artworks.map((a: Artwork) => a.updated_at),
    ...galleries.map((g: Gallery) => g.updated_at),
    Date.now() / 1000
  )
  const lastmod = formatDate(latestUpdate)

  // Static pages
  const staticPages = [
    { path: '/cs', priority: '1.0' },
    { path: '/en', priority: '1.0' },
    { path: '/cs/malby', priority: '0.9' },
    { path: '/en/paintings', priority: '0.9' },
    { path: '/cs/akvarely', priority: '0.9' },
    { path: '/en/watercolors', priority: '0.9' },
    { path: '/cs/o-mne', priority: '0.7' },
    { path: '/en/about', priority: '0.7' },
    { path: '/cs/kontakt', priority: '0.7' },
    { path: '/en/contact', priority: '0.7' },
  ]

  // Dynamic pages from galleries (year pages for paintings)
  const paintingYears: number[] = Array.from(new Set(
    galleries
      .filter((g: Gallery) => g.type === 'year' && g.category === 'painting' && g.year)
      .map((g: Gallery) => g.year as number)
  ))

  const yearPages = paintingYears.flatMap((year: number) => [
    { path: `/cs/malby/${year}`, priority: '0.8' },
    { path: `/en/paintings/${year}`, priority: '0.8' },
  ])

  // Watercolor series pages
  const watercolorSeries: string[] = galleries
    .filter((g: Gallery) => g.type === 'series' && g.category === 'watercolor' && g.series_key)
    .map((g: Gallery) => g.series_key as string)

  const seriesPages = watercolorSeries.flatMap((series: string) => [
    { path: `/cs/akvarely/${series}`, priority: '0.8' },
    { path: `/en/watercolors/${series}`, priority: '0.8' },
  ])

  const allPages = [...staticPages, ...yearPages, ...seriesPages]

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

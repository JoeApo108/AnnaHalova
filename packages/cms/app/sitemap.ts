import { MetadataRoute } from 'next'
import paintingsData from '@/data/paintings.json'
import watercolorsData from '@/data/watercolors.json'

const BASE_URL = 'https://annahalova.cz'

// Update this date when content actually changes (deploy date or last artwork added)
const LAST_CONTENT_UPDATE = '2026-04-07'
const LAST_STATIC_UPDATE = '2025-09-01'

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    // Czech
    { url: `${BASE_URL}/cs/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/cs/akvarely/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cs/o-mne/`, lastModified: LAST_STATIC_UPDATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/cs/kontakt/`, lastModified: LAST_STATIC_UPDATE, changeFrequency: 'monthly', priority: 0.7 },
    // English
    { url: `${BASE_URL}/en/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en/watercolors/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/en/about/`, lastModified: LAST_STATIC_UPDATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/en/contact/`, lastModified: LAST_STATIC_UPDATE, changeFrequency: 'monthly', priority: 0.7 },
  ]

  // Painting year galleries
  const paintingYearPages: MetadataRoute.Sitemap = paintingsData.years.flatMap((yearData) => [
    { url: `${BASE_URL}/cs/malby/${yearData.year}/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/en/paintings/${yearData.year}/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'monthly' as const, priority: 0.8 },
  ])

  // Watercolor series pages
  const watercolorSeriesPages: MetadataRoute.Sitemap = watercolorsData.series.flatMap((series) => [
    { url: `${BASE_URL}/cs/akvarely/${series.id}/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/en/watercolors/${series.id}/`, lastModified: LAST_CONTENT_UPDATE, changeFrequency: 'monthly' as const, priority: 0.8 },
  ])

  return [...staticPages, ...paintingYearPages, ...watercolorSeriesPages]
}

import { MetadataRoute } from 'next'
import paintingsData from '@/data/paintings.json'
import watercolorsData from '@/data/watercolors.json'

const BASE_URL = 'https://annahalova.cz'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    // Czech
    { url: `${BASE_URL}/cs`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/cs/malby`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cs/akvarely`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cs/o-mne`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/cs/kontakt`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // English
    { url: `${BASE_URL}/en`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en/paintings`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/en/watercolors`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/en/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/en/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  // Painting year galleries
  const paintingYearPages: MetadataRoute.Sitemap = paintingsData.years.flatMap((yearData) => [
    { url: `${BASE_URL}/cs/malby/${yearData.year}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/en/paintings/${yearData.year}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
  ])

  // Watercolor series pages
  const watercolorSeriesPages: MetadataRoute.Sitemap = watercolorsData.series.flatMap((series) => [
    { url: `${BASE_URL}/cs/akvarely/${series.id}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/en/watercolors/${series.id}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 },
  ])

  return [...staticPages, ...paintingYearPages, ...watercolorSeriesPages]
}

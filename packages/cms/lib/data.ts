import paintingsData from '@/data/paintings.json'
import watercolorsData from '@/data/watercolors.json'
import aboutData from '@/data/about.json'
import { Artwork, WatercolorSeries, CarouselSlide } from '@/data/types'

type Locale = 'cs' | 'en'

export function getCarouselSlides(): CarouselSlide[] {
  return paintingsData.carousel
}

export function getFeaturedPaintings(): Artwork[] {
  return paintingsData.featured as Artwork[]
}

export function getPaintingYears(): number[] {
  return paintingsData.years.map((y) => y.year)
}

export function getPaintingsByYear(year: number): Artwork[] {
  const yearData = paintingsData.years.find((y) => y.year === year)
  return (yearData?.artworks || []) as Artwork[]
}

export function getWatercolorSeries(): WatercolorSeries[] {
  return watercolorsData.series as WatercolorSeries[]
}

export function getWatercolorSeriesById(id: string): WatercolorSeries | undefined {
  return watercolorsData.series.find((s) => s.id === id) as WatercolorSeries | undefined
}

export function getAboutData() {
  return aboutData
}

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

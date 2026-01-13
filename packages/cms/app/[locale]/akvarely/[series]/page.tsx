import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Gallery from '@/components/Gallery'
import { getWatercolorSeries, getWatercolorSeriesById, getLocalizedText } from '@/lib/data-d1'
import { getRoutes } from '@/lib/routes'

// Force dynamic rendering to read from D1
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; series: string }>
}): Promise<Metadata> {
  const { locale, series: seriesId } = await params
  const series = await getWatercolorSeriesById(seriesId)
  if (!series) return { title: 'Not Found' }
  return {
    title: `${getLocalizedText(series.title, locale as 'cs' | 'en')} | Anna Hálová`,
  }
}

export default async function WatercolorSeriesPage({
  params,
}: {
  params: Promise<{ locale: string; series: string }>
}) {
  const { locale, series: seriesId } = await params

  const _t = await getTranslations({ locale, namespace: 'watercolors' })
  const routes = getRoutes(locale)
  const allSeries = await getWatercolorSeries()
  const series = await getWatercolorSeriesById(seriesId)

  if (!series) {
    notFound()
  }

  return (
    <div className="container">
      <h1 style={{ margin: '2rem 0' }}>
        {getLocalizedText(series.title, locale as 'cs' | 'en')}, {series.year}
      </h1>

      <nav className="sub-nav">
        {allSeries.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/${routes.watercolors}/${s.id}`}
            className={`sub-nav__link ${s.id === seriesId ? 'active' : ''}`}
          >
            {getLocalizedText(s.title, locale as 'cs' | 'en')}
          </Link>
        ))}
      </nav>

      {series.artworks.length > 0 ? (
        <Gallery artworks={series.artworks} locale={locale as 'cs' | 'en'} listView />
      ) : (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-text-light)' }}>
          {locale === 'cs' ? 'Připravujeme...' : 'Coming soon...'}
        </p>
      )}
    </div>
  )
}

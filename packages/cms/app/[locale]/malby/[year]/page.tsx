import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Gallery from '@/components/Gallery'
import { getPaintingYears, getPaintingsByYear } from '@/lib/data-d1'
import { getRoutes } from '@/lib/routes'

// Force dynamic rendering to read from D1
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; year: string }>
}): Promise<Metadata> {
  const { locale, year } = await params
  const t = await getTranslations({ locale, namespace: 'paintings' })
  return { title: `${t('title')} ${year} | Anna Hálová` }
}

export default async function PaintingsYearPage({
  params,
}: {
  params: Promise<{ locale: string; year: string }>
}) {
  const { locale, year } = await params

  const t = await getTranslations({ locale, namespace: 'paintings' })
  const routes = getRoutes(locale)
  const years = await getPaintingYears()
  const yearNum = parseInt(year, 10)

  if (!years.includes(yearNum)) {
    notFound()
  }

  const artworks = await getPaintingsByYear(yearNum)

  return (
    <div className="container">
      <h1 style={{ margin: '2rem 0' }}>{t('title')} {year}</h1>

      <nav className="sub-nav">
        {years.map((y) => (
          <Link
            key={y}
            href={`/${locale}/${routes.paintings}/${y}`}
            className={`sub-nav__link ${y === yearNum ? 'active' : ''}`}
          >
            {y}
          </Link>
        ))}
      </nav>

      <Gallery artworks={artworks} locale={locale as 'cs' | 'en'} listView />
    </div>
  )
}

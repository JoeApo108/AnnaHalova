import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'
import Gallery from '@/components/Gallery'
import { getPaintingYears, getPaintingsByYear } from '@/lib/data-d1'
import { getRoutes } from '@/lib/routes'

// Force dynamic rendering to read from D1
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'paintings' })
  return { title: `${t('title')} | Anna Hálová` }
}

export default async function PaintingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'paintings' })
  const routes = getRoutes(locale)
  const years = await getPaintingYears()
  const latestYear = years[0]
  const artworks = await getPaintingsByYear(latestYear)

  return (
    <div className="container">
      <h1 style={{ margin: '2rem 0' }}>{t('title')} {latestYear}</h1>

      <nav className="sub-nav">
        {years.map((year) => (
          <Link
            key={year}
            href={`/${locale}/${routes.paintings}/${year}`}
            className={`sub-nav__link ${year === latestYear ? 'active' : ''}`}
          >
            {year}
          </Link>
        ))}
      </nav>

      <Gallery artworks={artworks} locale={locale as 'cs' | 'en'} listView />
    </div>
  )
}

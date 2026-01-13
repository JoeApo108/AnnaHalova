import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getWatercolorSeries, getLocalizedText } from '@/lib/data-d1'
import { getRoutes } from '@/lib/routes'

// Force dynamic rendering to read from D1
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'watercolors' })
  return { title: `${t('title')} | Anna Hálová` }
}

export default async function WatercolorsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'watercolors' })
  const routes = getRoutes(locale)
  const series = await getWatercolorSeries()

  return (
    <div className="container">
      <h1 style={{ margin: '2rem 0' }}>{t('title')}</h1>

      <nav className="sub-nav">
        {series.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/${routes.watercolors}/${s.id}`}
            className="sub-nav__link"
          >
            {getLocalizedText(s.title, locale as 'cs' | 'en')}
          </Link>
        ))}
      </nav>

      {series.filter(s => s.preview.length > 0).map((s) => (
        <section key={s.id} className="gallery" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {getLocalizedText(s.title, locale as 'cs' | 'en')}, {s.year}
          </h2>
          <div className="gallery__grid">
            {s.preview.slice(0, 3).map((filename, index) => (
              <div key={index} className="gallery__item">
                <Image
                  src={`/images/thumbs/${filename}`}
                  alt={getLocalizedText(s.title, locale as 'cs' | 'en')}
                  width={300}
                  height={375}
                  className="gallery__image"
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link
              href={`/${locale}/${routes.watercolors}/${s.id}`}
              className="nav__link text-uppercase"
            >
              {t('viewCycle')} →
            </Link>
          </div>
        </section>
      ))}
    </div>
  )
}

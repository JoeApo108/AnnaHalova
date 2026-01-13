import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import Link from 'next/link'
import Carousel from '@/components/Carousel'
import Gallery from '@/components/Gallery'
import { getCarouselSlides, getFeaturedPaintings } from '@/lib/data-d1'
import { getRoutes } from '@/lib/routes'

// Force dynamic rendering to read from D1
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: ['/images/full/010---lilith.jpg'],
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'home' })
  const routes = getRoutes(locale)
  const carouselSlides = await getCarouselSlides()
  const featuredPaintings = await getFeaturedPaintings()

  return (
    <>
      <section className="hero">
        <Carousel slides={carouselSlides} locale={locale as 'cs' | 'en'} />
      </section>

      <section className="text-section">
        {(t.raw('intro') as string[]).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      <section className="gallery container">
        <h2 className="visually-hidden">{t('selectedWorks')}</h2>
        <Gallery artworks={featuredPaintings} locale={locale as 'cs' | 'en'} />
      </section>

      <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '3rem' }}>
        <Link
          href={`/${locale}/${routes.paintings}`}
          className="nav__link text-uppercase"
        >
          {t('viewAllPaintings')} →
        </Link>
      </div>
    </>
  )
}

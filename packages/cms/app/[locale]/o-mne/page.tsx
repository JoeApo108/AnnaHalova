import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Metadata } from 'next'
import { getAboutData, getLocalizedText } from '@/lib/data'
import ExhibitionsList from '@/components/ExhibitionsList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return { title: `${t('title')} | Anna Hálová` }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'about' })
  const about = getAboutData()

  return (
    <article className="about">
      <h1 className="about__title">Anna Hálová</h1>

      <section className="about__section">
        <p>*{about.bio.birthYear}, {about.bio.birthPlace}</p>
        <p>{getLocalizedText(about.bio.description, locale as 'cs' | 'en')}</p>
      </section>

      <section className="about__section">
        <h2>{t('exhibitions')}</h2>
        <ExhibitionsList exhibitions={about.exhibitions} locale={locale as 'cs' | 'en'} />
      </section>

      <section className="about__section">
        <h2>{t('residencies')}</h2>
        <ul style={{ listStyle: 'none', lineHeight: 2 }}>
          {about.residencies.map((residency, index) => (
            <li key={index}>
              <strong>{residency.year}</strong> — {getLocalizedText(residency.name, locale as 'cs' | 'en')}
            </li>
          ))}
        </ul>
      </section>

      <section className="about__section">
        <h2>{t('education')}</h2>
        <ul style={{ listStyle: 'none', lineHeight: 2 }}>
          {about.education.map((edu, index) => (
            <li key={index}>
              <strong>{edu.years}</strong> — {getLocalizedText(edu.name, locale as 'cs' | 'en')}
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}

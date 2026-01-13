import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Metadata } from 'next'
import contactData from '@/data/contact.json'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return { title: `${t('title')} | Anna Hálová` }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'contact' })
  const loc = locale as 'cs' | 'en'

  return (
    <div className="contact">
      <h1 className="contact__title">{t('title')}</h1>

      <div className="contact__info">
        <p>{contactData.intro[loc]}</p>

        <p style={{ marginTop: '2rem' }}>
          <strong>Email</strong><br />
          <a href={`mailto:${contactData.email}`}>{contactData.email}</a>
        </p>

        <p style={{ marginTop: '1.5rem' }}>
          <strong>{locale === 'cs' ? 'Telefon' : 'Phone'}</strong><br />
          <a href={`tel:${contactData.phone.replace(/\s/g, '')}`}>{contactData.phone}</a>
        </p>

        <p style={{ marginTop: '1.5rem' }}>
          <strong>{locale === 'cs' ? 'Lokace' : 'Location'}</strong><br />
          {contactData.location[loc]}
        </p>
      </div>

      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>{locale === 'cs' ? 'Na webu' : 'Online'}</h2>
        <div className="contact__social">
          {contactData.social.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="contact__social-link"
            >
              {link.name}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

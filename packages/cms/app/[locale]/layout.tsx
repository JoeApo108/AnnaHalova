import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { LightboxProvider } from '@/context/LightboxContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Lightbox from '@/components/Lightbox'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import '@/app/globals.css'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Security: Sanitize CSS values to prevent injection attacks
function sanitizeCSSValue(value: string): string {
  // Remove characters that could break out of CSS context or inject code
  // Block: { } < > ; " ' ` \ and url( to prevent external resource loading
  let sanitized = value.replace(/[{}<>;"'`\\]/g, '')
  // Block url() which could load external resources for tracking
  sanitized = sanitized.replace(/url\s*\(/gi, '')
  return sanitized
}

function sanitizeCSSKey(key: string): string {
  // CSS custom property names: only allow alphanumeric, hyphens
  return key.replace(/[^a-zA-Z0-9-]/g, '')
}

// Fetch theme CSS from D1
async function getThemeCSS(): Promise<string> {
  try {
    const { env } = getCloudflareContext() as { env: CloudflareEnv }
    const settings = await env.DB.prepare('SELECT key, value FROM theme_settings').all()
    const cssVars = (settings.results as Array<{ key: string; value: string }>)
      .map(s => `  --${sanitizeCSSKey(s.key)}: ${sanitizeCSSValue(s.value)};`)
      .join('\n')
    return `:root {\n${cssVars}\n}`
  } catch {
    return ''
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'cs' | 'en')) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  const messages = await getMessages()
  const themeCSS = await getThemeCSS()

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {themeCSS && <style>{themeCSS}</style>}
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <LightboxProvider>
            <Header locale={locale as 'cs' | 'en'} />
            <main>{children}</main>
            <Lightbox />
            <Footer />
          </LightboxProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

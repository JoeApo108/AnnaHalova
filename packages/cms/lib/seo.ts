import { Metadata } from 'next'
import { getRoutes } from './routes'

const BASE_URL = 'https://annahalova.cz'

/**
 * Build canonical + hreflang alternates for a page.
 * csPath/enPath are relative to the locale prefix, e.g. "malby" / "paintings".
 */
export function buildAlternates(
  locale: string,
  csPath: string,
  enPath: string,
): Metadata['alternates'] {
  const csUrl = `${BASE_URL}/cs${csPath ? `/${csPath}` : ''}`
  const enUrl = `${BASE_URL}/en${enPath ? `/${enPath}` : ''}`
  return {
    canonical: locale === 'cs' ? csUrl : enUrl,
    languages: {
      cs: csUrl,
      en: enUrl,
      'x-default': csUrl,
    },
  }
}

/**
 * Shortcut: build alternates from route keys.
 * routeKey matches keys in getRoutes() output, suffix is optional (e.g. year or series id).
 */
export function buildPageAlternates(
  locale: string,
  routeKey: 'paintings' | 'watercolors' | 'about' | 'contact',
  suffix?: string,
): Metadata['alternates'] {
  const csRoutes = getRoutes('cs')
  const enRoutes = getRoutes('en')
  const csPath = suffix ? `${csRoutes[routeKey]}/${suffix}` : csRoutes[routeKey]
  const enPath = suffix ? `${enRoutes[routeKey]}/${suffix}` : enRoutes[routeKey]
  return buildAlternates(locale, csPath, enPath)
}

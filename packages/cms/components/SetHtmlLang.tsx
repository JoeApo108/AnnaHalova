'use client'

import { useEffect } from 'react'

// The root layout owns <html> but sits above the [locale] segment and cannot
// know the locale, so it renders lang="cs"; correct it on the client for /en
export default function SetHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}

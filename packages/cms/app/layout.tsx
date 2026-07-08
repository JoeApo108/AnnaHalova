// Root layout — sole owner of <html>/<body>. It sits above the [locale]
// segment, so lang defaults to "cs"; SetHtmlLang corrects it client-side.
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  // Without this, relative og:image URLs resolve against a localhost
  // fallback on Cloudflare (no VERCEL_URL)
  metadataBase: new URL('https://annahalova.cz'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}

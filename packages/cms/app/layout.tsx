// Root layout - locale-specific layout overrides <html> with correct lang attribute
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

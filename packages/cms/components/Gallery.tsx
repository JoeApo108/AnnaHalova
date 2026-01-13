'use client'

import { Artwork } from '@/data/types'
import GalleryItem from './GalleryItem'
import { useLightbox } from '@/context/LightboxContext'
import { getLocalizedText, getMediumLabel, getStatusLabel } from '@/lib/data'

interface GalleryProps {
  artworks: Artwork[]
  locale: 'cs' | 'en'
  listView?: boolean
}

// Helper to get image URL - use direct path if it's a URL, otherwise use local path
function getImageSrc(filename: string, type: 'thumbs' | 'full'): string {
  if (filename.startsWith('/api/') || filename.startsWith('http')) {
    return filename
  }
  return `/images/${type}/${filename}`
}

export default function Gallery({ artworks, locale, listView = false }: GalleryProps) {
  const { openLightbox } = useLightbox()

  const handleItemClick = (index: number) => {
    const items = artworks.map((artwork) => {
      const status = getStatusLabel(artwork.status, locale)
      const meta = `${getMediumLabel(artwork.medium, locale)}, ${artwork.dimensions}${status ? ` · ${status}` : ''}`
      return {
        src: getImageSrc(artwork.filename, 'full'),
        title: getLocalizedText(artwork.title, locale),
        meta,
      }
    })
    openLightbox(items, index)
  }

  return (
    <section className={`gallery ${listView ? 'gallery--list' : ''}`}>
      <div className="gallery__grid">
        {artworks.map((artwork, index) => (
          <GalleryItem
            key={artwork.id}
            artwork={artwork}
            locale={locale}
            onClick={() => handleItemClick(index)}
          />
        ))}
      </div>
    </section>
  )
}

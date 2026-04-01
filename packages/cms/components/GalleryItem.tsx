'use client'

import { Artwork } from '@/data/types'
import { getLocalizedText, getMediumLabel, getStatusLabel } from '@/lib/data'
import { getImageSrc } from '@/lib/images'

interface GalleryItemProps {
  artwork: Artwork
  locale: 'cs' | 'en'
  onClick: () => void
}

export default function GalleryItem({ artwork, locale, onClick }: GalleryItemProps) {
  const title = getLocalizedText(artwork.title, locale)
  const medium = getMediumLabel(artwork.medium, locale)
  const status = getStatusLabel(artwork.status, locale)
  const meta = `${medium}, ${artwork.dimensions}${status ? ` · ${status}` : ''}`

  return (
    <div className="gallery__item" onClick={onClick}>
      <img
        src={getImageSrc(artwork.filename, 'thumbs')}
        alt={title}
        width={300}
        height={375}
        loading="lazy"
        decoding="async"
        className="gallery__image"
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="gallery__info">
        <h3 className="gallery__title">{title}</h3>
        <p className="gallery__meta">{meta}</p>
      </div>
    </div>
  )
}

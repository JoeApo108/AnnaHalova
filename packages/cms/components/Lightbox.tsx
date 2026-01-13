'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useLightbox } from '@/context/LightboxContext'

export default function Lightbox() {
  const t = useTranslations('lightbox')
  const { isOpen, items, currentIndex, closeLightbox, nextImage, prevImage } = useLightbox()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeLightbox, nextImage, prevImage])

  if (!isOpen || items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <div className="lightbox active" onClick={(e) => e.target === e.currentTarget && closeLightbox()}>
      <button className="lightbox__close" aria-label={t('close')} onClick={closeLightbox}>
        ×
      </button>
      <button className="lightbox__nav lightbox__prev" aria-label={t('previous')} onClick={prevImage}>
        ‹
      </button>
      <button className="lightbox__nav lightbox__next" aria-label={t('next')} onClick={nextImage}>
        ›
      </button>
      <div className="lightbox__content">
        <Image
          src={currentItem.src}
          alt={currentItem.title}
          width={1200}
          height={900}
          className="lightbox__image"
          style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 100px)', objectFit: 'contain' }}
        />
        <div className="lightbox__info">
          <h3 className="lightbox__title">{currentItem.title}</h3>
          <p className="lightbox__meta">{currentItem.meta}</p>
        </div>
      </div>
    </div>
  )
}

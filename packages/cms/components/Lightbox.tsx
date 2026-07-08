'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useLightbox } from '@/context/LightboxContext'

export default function Lightbox() {
  const t = useTranslations('lightbox')
  const { isOpen, items, currentIndex, closeLightbox, nextImage, prevImage } = useLightbox()
  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
      // Trap Tab inside the dialog — focus must not walk the page behind it
      if (e.key === 'Tab') {
        const focusables = containerRef.current?.querySelectorAll<HTMLElement>('button')
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeLightbox, nextImage, prevImage])

  // Move focus into the dialog on open, restore to the trigger on close
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    return () => previouslyFocused?.focus()
  }, [isOpen])

  if (!isOpen || items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <div
      ref={containerRef}
      className="lightbox active"
      role="dialog"
      aria-modal="true"
      aria-label={currentItem.title}
      onClick={(e) => e.target === e.currentTarget && closeLightbox()}
    >
      <button ref={closeButtonRef} className="lightbox__close" aria-label={t('close')} onClick={closeLightbox}>
        ×
      </button>
      <button className="lightbox__nav lightbox__prev" aria-label={t('previous')} onClick={prevImage}>
        ‹
      </button>
      <button className="lightbox__nav lightbox__next" aria-label={t('next')} onClick={nextImage}>
        ›
      </button>
      <div className="lightbox__content">
        <img
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

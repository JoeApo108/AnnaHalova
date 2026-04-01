'use client'

import { useState, useEffect, useCallback, TouchEvent } from 'react'
import { CarouselSlide } from '@/data/types'
import { getLocalizedText } from '@/lib/data'
import { getImageSrc } from '@/lib/images'

interface CarouselProps {
  slides: CarouselSlide[]
  locale: 'cs' | 'en'
}

export default function Carousel({ slides, locale }: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState(0)

  const goToSlide = useCallback((index: number) => {
    let newIndex = index
    if (newIndex < 0) newIndex = slides.length - 1
    if (newIndex >= slides.length) newIndex = 0
    setCurrentSlide(newIndex)
  }, [slides.length])

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide])
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide])

  // Autoplay
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [nextSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'ArrowRight') nextSlide()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  // Touch handlers
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.changedTouches[0].screenX)
  }

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEnd = e.changedTouches[0].screenX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }
  }

  return (
    <div className="carousel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div
        className="carousel__slides"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="carousel__slide">
            <img
              src={getImageSrc(slide.filename, 'full')}
              alt={getLocalizedText(slide.alt, locale)}
              width={1200}
              height={800}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding={index === 0 ? 'sync' : 'async'}
              fetchPriority={index === 0 ? 'high' : undefined}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
      <div className="carousel__dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel__dot ${index === currentSlide ? 'active' : ''}`}
            aria-label={`Slide ${index + 1}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}

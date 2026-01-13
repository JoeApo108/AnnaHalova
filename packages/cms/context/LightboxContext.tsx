'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface LightboxItem {
  src: string
  title: string
  meta: string
}

interface LightboxContextType {
  isOpen: boolean
  items: LightboxItem[]
  currentIndex: number
  openLightbox: (items: LightboxItem[], index: number) => void
  closeLightbox: () => void
  nextImage: () => void
  prevImage: () => void
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined)

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<LightboxItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (newItems: LightboxItem[], index: number) => {
    setItems(newItems)
    setCurrentIndex(index)
    setIsOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsOpen(false)
    document.body.style.overflow = ''
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  return (
    <LightboxContext.Provider
      value={{ isOpen, items, currentIndex, openLightbox, closeLightbox, nextImage, prevImage }}
    >
      {children}
    </LightboxContext.Provider>
  )
}

export function useLightbox() {
  const context = useContext(LightboxContext)
  if (!context) {
    throw new Error('useLightbox must be used within LightboxProvider')
  }
  return context
}

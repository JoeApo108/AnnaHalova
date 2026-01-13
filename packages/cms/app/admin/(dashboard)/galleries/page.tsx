'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SkeletonCard } from '@/components/admin/Skeleton'

// Normalize string: remove diacritics for accent-insensitive search
function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface Gallery {
  id: string
  slug: string
  name_cs: string
  name_en: string
  type: string
  year?: number
  item_count: number
}

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchGalleries = useCallback(async () => {
    const res = await fetch('/api/galleries')
    const data = await res.json()
    setGalleries(data.galleries)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGalleries()
  }, [fetchGalleries])

  const filteredGalleries = galleries.filter(g => {
    if (!searchTerm) return true
    const normalizedSearch = normalize(searchTerm)
    return normalize(g.name_cs).includes(normalizedSearch) ||
           normalize(g.name_en).includes(normalizedSearch)
  })

  const groupedGalleries = filteredGalleries.reduce((acc, gallery) => {
    const type = gallery.type
    if (!acc[type]) acc[type] = []
    acc[type].push(gallery)
    return acc
  }, {} as Record<string, Gallery[]>)

  const typeLabels: Record<string, string> = {
    carousel: 'Carousel',
    featured: 'Featured',
    year: 'By Year (Paintings)',
    series: 'Series (Watercolors)'
  }

  // Define display order for gallery types
  const typeOrder = ['carousel', 'featured', 'year', 'series']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Galleries</h1>
        <Link href="/admin/galleries/new" className="admin-btn">
          + Create Gallery
        </Link>
      </div>

      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="search-container">
          <input
            type="text"
            className="admin-input"
            placeholder="Search galleries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingRight: '32px' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-muted"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-card">
          <div className="gallery-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : (
        typeOrder
          .filter(type => groupedGalleries[type]?.length > 0)
          .map(type => (
            <div key={type} className="admin-card" style={{ marginBottom: '24px' }}>
              <h2 style={{ marginBottom: '16px' }}>{typeLabels[type] || type}</h2>
              <div className="gallery-grid">
                {groupedGalleries[type].map((gallery) => (
                  <Link
                    key={gallery.id}
                    href={`/admin/galleries/${gallery.id}`}
                    className="gallery-item"
                  >
                    <div style={{ fontWeight: 500 }}>{gallery.name_cs}</div>
                    <div className="text-secondary" style={{ fontSize: '12px' }}>
                      {gallery.item_count} items
                      {gallery.year && ` / ${gallery.year}`}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
      )}

      {!loading && filteredGalleries.length === 0 && (
        <div className="admin-card">
          <p className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
            {searchTerm ? 'No galleries match your search.' : 'No galleries yet.'}
          </p>
        </div>
      )}
    </div>
  )
}

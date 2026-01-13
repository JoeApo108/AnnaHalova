'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GalleryEditor } from '@/components/admin/GalleryEditor'
import { BilingualInput } from '@/components/admin/BilingualInput'
import { Breadcrumbs } from '@/components/admin/Breadcrumbs'
import { useToast } from '@/components/admin/ToastProvider'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { usePlatformModKey } from '@/hooks/usePlatformModKey'

interface GalleryItem {
  id: string
  filename: string
  title_cs: string
  title_en: string
  thumbnail_url?: string
  position: number
}

interface Gallery {
  id: string
  slug: string
  name_cs: string
  name_en: string
  type: string
  category?: string
  items: GalleryItem[]
}

interface AvailableArtwork {
  id: string
  title_cs: string
  title_en: string
  filename: string
  thumbnail_url?: string
  category: string
  year: number
}

export default function GalleryEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { showToast } = useToast()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const modKey = usePlatformModKey()

  // Track only name fields for unsaved changes (items are auto-saved)
  const trackableData = gallery ? { name_cs: gallery.name_cs, name_en: gallery.name_en } : null
  const { hasChanges, resetInitialState } = useUnsavedChanges(
    trackableData || { name_cs: '', name_en: '' },
    !saving && !loading && !!gallery,
    !loading && !!gallery // Start tracking only after data loads
  )

  // Artwork picker state
  const [showPicker, setShowPicker] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [availableArtworks, setAvailableArtworks] = useState<AvailableArtwork[]>([])
  const [loadingArtworks, setLoadingArtworks] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchGallery = useCallback(async () => {
    const res = await fetch(`/api/galleries/${id}`)
    if (res.ok) {
      const data = await res.json()
      setGallery(data)
    }
    setLoading(false)
  }, [id])

  const fetchAvailableArtworks = useCallback(async () => {
    setLoadingArtworks(true)
    const res = await fetch('/api/artworks')
    if (res.ok) {
      const data = await res.json()
      setAvailableArtworks(data.artworks || [])
    }
    setLoadingArtworks(false)
  }, [])

  function openArtworkPicker() {
    setShowPicker(true)
    fetchAvailableArtworks()
  }

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  async function addArtworkToGallery(artwork: AvailableArtwork) {
    const res = await fetch(`/api/galleries/${id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId: artwork.id })
    })

    if (res.ok) {
      // Refresh gallery data
      fetchGallery()
      showToast('Artwork added to gallery')
      setShowPicker(false)
      // Notify footer to update pending changes count
      window.dispatchEvent(new CustomEvent('content-changed'))
    } else {
      const error = await res.json()
      showToast(error.error || 'Failed to add artwork', 'error')
    }
  }

  async function handleSave() {
    if (!gallery) return
    setSaving(true)

    const res = await fetch(`/api/galleries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_cs: gallery.name_cs,
        name_en: gallery.name_en,
        is_visible: true
      })
    })

    setSaving(false)
    if (res.ok) {
      resetInitialState() // Clear unsaved changes warning
      showToast('Gallery saved successfully')
      window.dispatchEvent(new CustomEvent('content-changed'))
      // Redirect back to galleries list
      router.push('/admin/galleries')
    } else {
      showToast('Failed to save gallery', 'error')
    }
  }

  useKeyboardShortcut([
    {
      key: 's',
      modifiers: ['meta'],
      handler: () => {
        if (!saving) handleSave()
      }
    },
    {
      key: 's',
      modifiers: ['ctrl'],
      handler: () => {
        if (!saving) handleSave()
      }
    },
    {
      key: 'Escape',
      handler: () => {
        if (showPicker) setShowPicker(false)
        if (showDeleteModal) setShowDeleteModal(false)
      }
    }
  ])

  async function handleDelete() {
    if (!gallery) return

    if (gallery.items.length > 0) {
      showToast(`Cannot delete gallery with ${gallery.items.length} items. Remove all artworks first.`, 'error')
      return
    }

    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Gallery deleted')
      window.dispatchEvent(new CustomEvent('content-changed'))
      router.push('/admin/galleries')
    } else {
      showToast('Failed to delete gallery', 'error')
    }
    setShowDeleteModal(false)
  }

  // Normalize string for Czech diacritics-insensitive search
  function normalize(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  }

  // Filter artworks not already in gallery
  const galleryItemIds = new Set(gallery?.items.map(i => i.id) || [])
  const filteredArtworks = availableArtworks
    .filter(a => !galleryItemIds.has(a.id))
    .filter(a =>
      searchTerm === '' ||
      normalize(a.title_cs).includes(normalize(searchTerm)) ||
      normalize(a.title_en).includes(normalize(searchTerm))
    )

  if (loading) return <p>Loading...</p>
  if (!gallery) return <p>Gallery not found</p>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Galleries', href: '/admin/galleries' },
          { label: gallery.name_cs || 'Edit Gallery' }
        ]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0 }}>Edit Gallery: {gallery.name_cs}</h1>
            {hasChanges && !saving && (
              <span className="badge-edit">Unsaved changes</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDelete}
              className="admin-btn admin-btn-danger"
            >
              Delete
            </button>
            <button
              onClick={handleSave}
              className="admin-btn"
              disabled={saving}
              title={`Save changes (${modKey}+S)`}
              aria-keyshortcuts="Control+S Meta+S"
            >
              {saving ? 'Saving...' : 'Save'}
              <span className="shortcut-hint text-secondary">{modKey}+S</span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Settings */}
        <div className="admin-card">
          <h2>Settings</h2>
          <BilingualInput
            label="Name"
            valueCs={gallery.name_cs}
            valueEn={gallery.name_en}
            onChangeCs={(v) => setGallery({ ...gallery, name_cs: v })}
            onChangeEn={(v) => setGallery({ ...gallery, name_en: v })}
          />

          <div className="admin-form-group">
            <label className="admin-label">Type</label>
            <input
              type="text"
              className="admin-input"
              value={gallery.type}
              disabled
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Slug</label>
            <input
              type="text"
              className="admin-input"
              value={gallery.slug}
              disabled
            />
          </div>
        </div>

        {/* Drag-drop editor */}
        <div className="admin-card">
          <GalleryEditor
            galleryId={gallery.id}
            initialItems={gallery.items}
            onAddClick={openArtworkPicker}
            onItemsChange={(items) => setGallery({ ...gallery, items })}
          />
        </div>
      </div>

      {/* Artwork Picker Modal */}
      {showPicker && (
        <div className="admin-modal-overlay">
          <div
            className="modal-content"
            style={{
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Add Artwork</h2>
                <button onClick={() => setShowPicker(false)} className="modal-close">
                  ×
                </button>
              </div>
              <input
                type="text"
                placeholder="Search artworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input"
                style={{ marginTop: '12px', width: '100%' }}
              />
            </div>

            <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
              {loadingArtworks ? (
                <p>Loading artworks...</p>
              ) : filteredArtworks.length === 0 ? (
                <p className="text-secondary">No artworks available to add</p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {filteredArtworks.map(artwork => (
                    <div
                      key={artwork.id}
                      onClick={() => addArtworkToGallery(artwork)}
                      className="artwork-picker-item"
                    >
                      <div
                        className="item-thumbnail"
                        style={{
                          aspectRatio: '4/5',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          backgroundImage: artwork.thumbnail_url
                            ? `url(${artwork.thumbnail_url})`
                            : artwork.filename
                              ? `url(/api/images/thumbs/${artwork.filename})`
                              : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {artwork.title_cs || artwork.title_en}
                      </div>
                      <div className="text-secondary" style={{ fontSize: '11px' }}>
                        {artwork.year}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Gallery"
        message={`Are you sure you want to delete "${gallery?.name_cs}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}

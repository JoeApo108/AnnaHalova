'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ImageUploader, ProcessedImage } from '@/components/admin/ImageUploader'
import { BilingualInput } from '@/components/admin/BilingualInput'
import { Breadcrumbs } from '@/components/admin/Breadcrumbs'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { usePlatformModKey } from '@/hooks/usePlatformModKey'
import { useToast } from '@/components/admin/ToastProvider'

interface Artwork {
  id: string
  filename: string
  title_cs: string
  title_en: string
  medium_cs: string
  medium_en: string
  dimensions: string
  year: number
  category: string
  status: string
  image_url?: string
}

export default function ArtworkEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined
  const isNew = !id || id === 'new'

  // Use stable initial year to avoid hydration mismatch
  const [artwork, setArtwork] = useState<Artwork>({
    id: '',
    filename: '',
    title_cs: '',
    title_en: '',
    medium_cs: 'olej na plátně',
    medium_en: 'oil on canvas',
    dimensions: '',
    year: 2024, // Stable default, will be updated on client
    category: 'painting',
    status: 'available'
  })
  const [loading, setLoading] = useState(!isNew)
  const [pendingImage, setPendingImage] = useState<ProcessedImage | null>(null)

  // Set current year on client to avoid hydration mismatch
  useEffect(() => {
    if (isNew) {
      setArtwork(prev => ({ ...prev, year: new Date().getFullYear() }))
    }
  }, [isNew])
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { showToast } = useToast()
  const modKey = usePlatformModKey()
  const { hasChanges, resetInitialState } = useUnsavedChanges(
    artwork,
    !saving && !loading,
    !loading // Start tracking only after data loads
  )

  const fetchArtwork = useCallback(async () => {
    const res = await fetch(`/api/artworks/${id}`)
    if (res.ok) {
      const data = await res.json()
      setArtwork(data)
    }
    setLoading(false)
  }, [id])

  const handleSave = useCallback(async () => {
    setSaving(true)

    try {
      let finalArtwork = { ...artwork }

      // Upload image first if there's a pending upload
      if (pendingImage) {
        showToast('Uploading image...', 'info')

        // Use pre-resized blobs (resizing already done on image selection)
        const formData = new FormData()
        formData.append('original', pendingImage.original)
        formData.append('thumb', pendingImage.thumb, 'thumb.jpg')
        formData.append('full', pendingImage.full, 'full.jpg')
        formData.append('artworkId', artwork.id || 'new')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          showToast(error.error || 'Upload failed', 'error')
          setSaving(false)
          return
        }

        const uploadData = await uploadRes.json()
        finalArtwork = {
          ...finalArtwork,
          filename: uploadData.filename,
          image_url: uploadData.url
        }
        setPendingImage(null)
      }

      // Save artwork metadata
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/artworks' : `/api/artworks/${id}`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalArtwork)
      })

      if (res.ok) {
        resetInitialState() // Clear unsaved changes warning
        showToast('Artwork saved successfully')
        router.push('/admin/artworks')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to save artwork', 'error')
      }
    } catch (err) {
      console.error('Save error:', err)
      showToast('Failed to save artwork', 'error')
    }

    setSaving(false)
  }, [artwork, pendingImage, id, isNew, router, showToast, resetInitialState])

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
    }
  ])

  useEffect(() => {
    if (!isNew) {
      fetchArtwork()
    }
  }, [isNew, fetchArtwork])

  function handleDelete() {
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    await fetch(`/api/artworks/${id}`, { method: 'DELETE' })
    showToast('Artwork deleted')
    router.push('/admin/artworks')
    setShowDeleteModal(false)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Artworks', href: '/admin/artworks' },
          { label: isNew ? 'New Artwork' : (artwork.title_cs || 'Edit Artwork') }
        ]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0 }}>{isNew ? 'Add Artwork' : 'Edit Artwork'}</h1>
            {hasChanges && !saving && (
              <span className="badge-edit">Unsaved changes</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isNew && (
              <button onClick={handleDelete} className="admin-btn admin-btn-secondary text-danger">
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              className="admin-btn"
              disabled={saving}
              title={`Save changes (${modKey}+S)`}
            >
              {saving ? 'Saving...' : (pendingImage ? 'Save & Upload' : 'Save')}
              <span className="shortcut-hint">{modKey}+S</span>
            </button>
          </div>
        </div>
      </div>

      <div className="form-grid">
        {/* Image */}
        <div className="admin-card">
          <h2>Image</h2>
          <ImageUploader
            artworkId={artwork.id || 'new'}
            currentImage={artwork.image_url}
            onImageProcessed={(processed) => setPendingImage(processed)}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>

        {/* Form */}
        <div className="admin-card">
          <BilingualInput
            label="Title"
            valueCs={artwork.title_cs}
            valueEn={artwork.title_en}
            onChangeCs={(v) => setArtwork({ ...artwork, title_cs: v })}
            onChangeEn={(v) => setArtwork({ ...artwork, title_en: v })}
          />

          <BilingualInput
            label="Medium"
            valueCs={artwork.medium_cs}
            valueEn={artwork.medium_en}
            onChangeCs={(v) => setArtwork({ ...artwork, medium_cs: v })}
            onChangeEn={(v) => setArtwork({ ...artwork, medium_en: v })}
          />

          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Dimensions</label>
              <input
                type="text"
                className="admin-input"
                value={artwork.dimensions}
                onChange={(e) => setArtwork({ ...artwork, dimensions: e.target.value })}
                placeholder="60×97 cm"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Year</label>
              <input
                type="number"
                className="admin-input"
                value={artwork.year}
                onChange={(e) => setArtwork({ ...artwork, year: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Category</label>
              <select
                className="admin-input"
                value={artwork.category}
                onChange={(e) => setArtwork({ ...artwork, category: e.target.value })}
              >
                <option value="painting">Painting</option>
                <option value="watercolor">Watercolor</option>
                <option value="ink">Ink</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Status</label>
              <select
                className="admin-input"
                value={artwork.status}
                onChange={(e) => setArtwork({ ...artwork, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="donated">Donated</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Artwork"
        message={`Are you sure you want to delete "${artwork.title_cs || artwork.title_en || 'this artwork'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}

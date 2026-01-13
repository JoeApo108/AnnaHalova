'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/admin/Breadcrumbs'
import { useToast } from '@/components/admin/ToastProvider'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

export default function NewGalleryPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    type: 'year',
    name_cs: '',
    name_en: '',
    category: 'painting',
    year: 2024, // Stable default to avoid hydration mismatch
    series_key: ''
  })

  // Track unsaved changes (only track name fields as meaningful input)
  const { hasChanges } = useUnsavedChanges(
    { name_cs: formData.name_cs, name_en: formData.name_en },
    !saving,
    true // Always ready for new forms (no fetch needed)
  )

  // Set current year on client to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => ({ ...prev, year: new Date().getFullYear() }))
  }, [])

  // Generate slug from name or type-specific identifier
  function generateSlug(): string {
    if (formData.type === 'year') {
      return String(formData.year)
    } else if (formData.type === 'series') {
      return formData.series_key || formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    } else if (formData.type === 'carousel') {
      return 'carousel'
    } else if (formData.type === 'featured') {
      return 'featured'
    }
    return formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const slug = generateSlug()
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          year: formData.type === 'year' ? formData.year : null,
          series_key: formData.type === 'series' ? formData.series_key : null,
          category: ['year', 'series'].includes(formData.type) ? formData.category : null
        })
      })

      if (res.ok) {
        const data = await res.json()
        window.dispatchEvent(new CustomEvent('content-changed'))
        router.push(`/admin/galleries/${data.id}`)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to create gallery', 'error')
        setSaving(false)
      }
    } catch {
      showToast('Error creating gallery', 'error')
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Galleries', href: '/admin/galleries' },
          { label: 'New Gallery' }
        ]} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>Create Gallery</h1>
          {hasChanges && !saving && (
            <span className="badge-edit">Unsaved changes</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="admin-card" style={{ maxWidth: '600px' }}>
          <div className="admin-form-group">
            <label className="admin-label">Type</label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value
                // Auto-set category based on type
                const newCategory = newType === 'series' ? 'watercolor' :
                                   newType === 'year' ? 'painting' : 'painting'
                setFormData({ ...formData, type: newType, category: newCategory })
              }}
              className="admin-input"
            >
              <option value="year">By Year (Paintings)</option>
              <option value="series">Series (Watercolors)</option>
              <option value="carousel">Carousel</option>
              <option value="featured">Featured</option>
            </select>
          </div>

          <div className="admin-grid-2" style={{ marginBottom: '20px' }}>
            <div>
              <label className="admin-label">Name (CS)</label>
              <input
                type="text"
                value={formData.name_cs}
                onChange={(e) => setFormData({ ...formData, name_cs: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Name (EN)</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="admin-input"
                required
              />
            </div>
          </div>

          {['year', 'series'].includes(formData.type) && (
            <div className="admin-form-group">
              <label className="admin-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="admin-input"
              >
                <option value="painting">Painting</option>
                <option value="watercolor">Watercolor</option>
                <option value="ink">Ink</option>
              </select>
            </div>
          )}

          {formData.type === 'year' && (
            <div className="admin-form-group">
              <label className="admin-label">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="admin-input"
                style={{ maxWidth: '200px' }}
              />
            </div>
          )}

          {formData.type === 'series' && (
            <div className="admin-form-group">
              <label className="admin-label">Series Key (URL slug)</label>
              <input
                type="text"
                value={formData.series_key}
                onChange={(e) => setFormData({ ...formData, series_key: e.target.value })}
                className="admin-input"
                placeholder="e.g. smaragdovy-vecer"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Creating...' : 'Create Gallery'}
            </button>
            <Link href="/admin/galleries" className="admin-btn admin-btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

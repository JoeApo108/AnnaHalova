'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SkeletonRow } from '@/components/admin/Skeleton'
import { InlineEdit } from '@/components/admin/InlineEdit'
import { useToast } from '@/components/admin/ToastProvider'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

interface Artwork {
  id: string
  filename: string
  title_cs: string
  title_en: string
  year: number
  category: string
  status: string
  thumbnail_url?: string
}

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ category: '', year: '', search: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { showToast } = useToast()

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === artworks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(artworks.map(a => a.id)))
    }
  }

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const fetchArtworks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      ...(filter.category && { category: filter.category }),
      ...(filter.year && { year: filter.year }),
      ...(filter.search && { search: filter.search })
    })

    const res = await fetch(`/api/artworks?${params}`)
    const data = await res.json()

    setArtworks(data.artworks)
    setTotalPages(data.pagination.pages)
    setLoading(false)
  }, [page, filter])

  async function handleBulkDelete() {
    setDeleting(true)
    let successCount = 0
    let failCount = 0

    for (const id of selectedIds) {
      const res = await fetch(`/api/artworks/${id}`, { method: 'DELETE' })
      if (res.ok) successCount++
      else failCount++
    }

    setDeleting(false)
    setShowBulkDeleteModal(false)
    clearSelection()
    fetchArtworks()

    if (failCount === 0) {
      showToast(`Deleted ${successCount} artwork(s)`)
    } else {
      showToast(`Deleted ${successCount}, failed ${failCount}`, 'error')
    }
  }

  useEffect(() => {
    clearSelection()
    fetchArtworks()
  }, [fetchArtworks, clearSelection])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Artworks</h1>
        <Link href="/admin/artworks/new" className="admin-btn">
          + Add Artwork
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <select
            className="admin-input"
            style={{ width: 'auto' }}
            value={filter.category}
            onChange={(e) => { setFilter({ ...filter, category: e.target.value }); setPage(1) }}
          >
            <option value="">All Categories</option>
            <option value="painting">Paintings</option>
            <option value="watercolor">Watercolors</option>
            <option value="ink">Ink</option>
          </select>

          <select
            className="admin-input"
            style={{ width: 'auto' }}
            value={filter.year}
            onChange={(e) => { setFilter({ ...filter, year: e.target.value }); setPage(1) }}
          >
            <option value="">All Years</option>
            {[2025, 2024, 2023, 2020].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <div style={{ position: 'relative', width: '200px' }}>
            <input
              type="text"
              className="admin-input"
              style={{ width: '100%', paddingRight: '32px' }}
              placeholder="Search..."
              value={filter.search}
              onChange={(e) => { setFilter({ ...filter, search: e.target.value }); setPage(1) }}
            />
            {filter.search && (
              <button
                onClick={() => { setFilter({ ...filter, search: '' }); setPage(1) }}
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

          {(filter.category || filter.year || filter.search) && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => { setFilter({ category: '', year: '', search: '' }); setPage(1) }}
              style={{ padding: '8px 16px' }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="admin-card bulk-actions-bar">
          <span style={{ fontWeight: 500 }}>{selectedIds.size} selected</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="admin-btn admin-btn-secondary" onClick={clearSelection}>
              Clear
            </button>
            <button
              className="admin-btn admin-btn-danger"
              onClick={() => setShowBulkDeleteModal(true)}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Artworks Table */}
      <div className="admin-card">
        {loading ? (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '12px', width: '40px' }}>
                  <input
                    type="checkbox"
                    disabled
                    style={{ cursor: 'not-allowed' }}
                  />
                </th>
                <th style={{ padding: '12px' }}>Image</th>
                <th style={{ padding: '12px' }}>Title</th>
                <th style={{ padding: '12px' }}>Year</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '12px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={artworks.length > 0 && selectedIds.size === artworks.length}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px' }}>Image</th>
                <th style={{ padding: '12px' }}>Title</th>
                <th style={{ padding: '12px' }}>Year</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {artworks.map((artwork) => (
                <tr key={artwork.id} className={selectedIds.has(artwork.id) ? 'row-selected' : ''}>
                  <td data-label="Select" style={{ padding: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(artwork.id)}
                      onChange={() => toggleSelection(artwork.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td data-label="Image" style={{ padding: '12px' }}>
                    <div
                      className="item-thumbnail"
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '4px',
                        backgroundImage: artwork.thumbnail_url ? `url(${artwork.thumbnail_url})` : undefined,
                        backgroundSize: 'cover'
                      }}
                    />
                  </td>
                  <td data-label="Title" style={{ padding: '12px' }}>
                    <InlineEdit
                      value={artwork.title_cs}
                      label="Czech title"
                      placeholder="Untitled"
                      onSave={async (newTitle) => {
                        const res = await fetch(`/api/artworks/${artwork.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...artwork, title_cs: newTitle })
                        })
                        if (!res.ok) throw new Error('Failed to save')
                        fetchArtworks()
                        showToast('Title updated')
                      }}
                    />
                    <div className="text-secondary" style={{ fontSize: '12px' }}>{artwork.title_en}</div>
                    {/* Mobile-only meta row */}
                    <div className="mobile-meta" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span className="text-secondary" style={{ fontSize: '12px' }}>{artwork.year}</span>
                      <span className="badge-category">{artwork.category}</span>
                      <span className="badge-published">{artwork.status}</span>
                    </div>
                  </td>
                  <td data-label="Year" className="desktop-only" style={{ padding: '12px' }}>{artwork.year}</td>
                  <td data-label="Category" className="desktop-only" style={{ padding: '12px' }}>
                    <span className="badge-category">
                      {artwork.category}
                    </span>
                  </td>
                  <td data-label="Status" className="desktop-only" style={{ padding: '12px' }}>
                    <span className="badge-published">
                      {artwork.status}
                    </span>
                  </td>
                  <td data-label="" style={{ padding: '12px' }}>
                    <Link href={`/admin/artworks/${artwork.id}`} className="admin-btn admin-btn-secondary" style={{ padding: '6px 12px' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {artworks.length === 0 && !loading && (
          <p className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
            No artworks found.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              className="admin-btn admin-btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ padding: '10px' }}>Page {page} of {totalPages}</span>
            <button
              className="admin-btn admin-btn-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Artworks"
        message={`Are you sure you want to delete ${selectedIds.size} artwork(s)? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete All'}
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div>
  )
}

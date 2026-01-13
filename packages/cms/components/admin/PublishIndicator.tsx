// components/admin/PublishIndicator.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

export function PublishIndicator() {
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  const fetchPendingCount = useCallback(() => {
    fetch('/api/publish/pending')
      .then(res => res.json())
      .then(data => setPendingCount(data.pending?.total || 0))
      .catch(() => setPendingCount(0))
  }, [])

  useEffect(() => {
    // Fetch on mount
    fetchPendingCount()

    // Listen for events that should refresh the count
    const handleRefresh = () => fetchPendingCount()

    // After publishing
    window.addEventListener('publish-complete', handleRefresh)
    // After content changes (gallery edits, artwork saves, etc.)
    window.addEventListener('content-changed', handleRefresh)

    return () => {
      window.removeEventListener('publish-complete', handleRefresh)
      window.removeEventListener('content-changed', handleRefresh)
    }
  }, [fetchPendingCount])

  if (pendingCount === null) return null // Loading

  const hasDrafts = pendingCount > 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: hasDrafts ? '#f59e0b' : '#22c55e'
          }}
        />
        <span className="text-secondary" style={{ fontSize: '14px' }}>
          {hasDrafts ? `${pendingCount} unpublished change${pendingCount > 1 ? 's' : ''}` : 'All changes published'}
        </span>
      </div>
      {hasDrafts && (
        <Link href="/admin/publish" className="admin-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
          Publish Now
        </Link>
      )}
    </div>
  )
}

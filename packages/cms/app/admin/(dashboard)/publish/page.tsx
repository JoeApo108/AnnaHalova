'use client'

import { useState, useEffect, useCallback } from 'react'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { usePlatformModKey } from '@/hooks/usePlatformModKey'

interface PendingChanges {
  galleries: { id: string; name_cs: string; type: string; change_type: string }[]
  deletions: { id: string; item_type: string; item_id: string; item_name: string }[]
  theme: { key: string; label: string }[]
  total: number
}

export default function PublishPage() {
  const [pending, setPending] = useState<PendingChanges | null>(null)
  const [lastPublish, setLastPublish] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState<{
    type: 'gallery' | 'theme' | 'all'
    id?: string
    name?: string
    isNew?: boolean
  } | null>(null)
  const modKey = usePlatformModKey()

  // Keyboard shortcut for publish (Cmd/Ctrl+Enter)
  useKeyboardShortcut([
    {
      key: 'Enter',
      modifiers: ['meta'],
      handler: () => {
        if (!publishing && pending?.total && pending.total > 0) handlePublish()
      }
    },
    {
      key: 'Enter',
      modifiers: ['ctrl'],
      handler: () => {
        if (!publishing && pending?.total && pending.total > 0) handlePublish()
      }
    }
  ])

  const fetchPending = useCallback(async () => {
    const res = await fetch('/api/publish/pending')
    const data = await res.json()
    setPending(data.pending)
    setLastPublish(data.lastPublish)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  async function handlePublish() {
    setPublishing(true)
    setResult(null)

    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    })

    const data = await res.json()
    setResult({ success: data.success, message: data.message || data.error })

    if (data.success) {
      fetchPending()
      setNotes('')
      // Notify other components (like PublishIndicator) to refresh
      window.dispatchEvent(new CustomEvent('publish-complete'))
    }

    setPublishing(false)
  }

  async function handleDiscard() {
    if (!confirmDiscard) return
    setDiscarding(true)
    setResult(null)

    try {
      const body = confirmDiscard.type === 'all'
        ? { all: true }
        : confirmDiscard.type === 'gallery'
          ? { type: 'gallery', id: confirmDiscard.id }
          : { type: 'theme', key: confirmDiscard.id }

      const res = await fetch('/api/publish/discard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        const action = confirmDiscard.isNew ? 'deleted' : 'discarded'
        const message = confirmDiscard.type === 'all'
          ? `${data.discarded} change(s) discarded`
          : `Changes ${action} successfully`
        setResult({ success: true, message })
        fetchPending()
        window.dispatchEvent(new CustomEvent('publish-complete'))
      } else {
        setResult({ success: false, message: data.error || 'Failed to discard' })
      }
    } catch {
      setResult({ success: false, message: 'Failed to discard changes' })
    }

    setConfirmDiscard(null)
    setDiscarding(false)
  }

  // Count discardable changes (galleries + theme, not deletions)
  const discardableCount = (pending?.galleries?.length ?? 0) + (pending?.theme?.length ?? 0)

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Publish Changes</h1>

      {result && (
        <div
          className={`admin-card ${result.success ? 'result-success' : 'result-error'}`}
          style={{ marginBottom: '24px' }}
        >
          {result.message}
        </div>
      )}

      {pending?.total === 0 ? (
        <div className="admin-card">
          <p className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
            No unpublished changes. Your site is up to date!
          </p>
        </div>
      ) : (
        <>
          <div className="admin-card warning-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>You have {pending?.total} unpublished changes</span>
            {discardableCount > 0 && (
              <button
                onClick={() => setConfirmDiscard({ type: 'all' })}
                className="admin-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Discard All ({discardableCount})
              </button>
            )}
          </div>

          {/* Galleries changes */}
          {(pending?.galleries?.length ?? 0) > 0 && (
            <div className="admin-card" style={{ marginBottom: '24px' }}>
              <h2>Galleries ({pending?.galleries?.length ?? 0} changes)</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pending?.galleries?.map(g => (
                  <li key={g.id} className="list-item-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <span className={g.change_type === 'new' ? 'badge-new' : 'badge-edit'}>
                        {g.change_type === 'new' ? 'NEW' : 'EDIT'}
                      </span>
                      {g.name_cs} <span className="text-secondary" style={{ fontSize: '12px' }}>({g.type})</span>
                    </span>
                    <button
                      onClick={() => setConfirmDiscard({
                        type: 'gallery',
                        id: g.id,
                        name: g.name_cs,
                        isNew: g.change_type === 'new'
                      })}
                      className="admin-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      {g.change_type === 'new' ? 'Delete' : 'Discard'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deletions */}
          {(pending?.deletions?.length ?? 0) > 0 && (
            <div className="admin-card" style={{ marginBottom: '24px' }}>
              <h2>Deletions ({pending?.deletions?.length ?? 0})</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pending?.deletions?.map(d => (
                  <li key={d.id} className="list-item-border">
                    <span className="badge-delete" style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' }}>
                      DELETE
                    </span>
                    {d.item_name} <span className="text-secondary" style={{ fontSize: '12px' }}>({d.item_type})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Theme changes */}
          {(pending?.theme?.length ?? 0) > 0 && (
            <div className="admin-card" style={{ marginBottom: '24px' }}>
              <h2>Theme ({pending?.theme?.length ?? 0} changes)</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pending?.theme?.map(t => (
                  <li key={t.key} className="list-item-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t.label}</span>
                    <button
                      onClick={() => setConfirmDiscard({
                        type: 'theme',
                        id: t.key,
                        name: t.label
                      })}
                      className="admin-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Discard
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Publish form */}
          <div className="admin-card">
            <div className="admin-form-group">
              <label className="admin-label">Notes (optional)</label>
              <textarea
                className="admin-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your changes..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-secondary" style={{ fontSize: '14px' }} suppressHydrationWarning>
                Last published: {lastPublish ? new Date(lastPublish).toLocaleString() : 'Never'}
              </span>
              <button
                onClick={handlePublish}
                className="admin-btn"
                disabled={publishing}
                style={{ minWidth: '150px' }}
                title={`Publish all changes (${modKey}+Enter)`}
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                {publishing ? 'Publishing...' : 'Publish Now'}
                <span className="shortcut-hint text-secondary">{modKey}+Enter</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDiscard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setConfirmDiscard(null)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: '400px', width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px' }}>
              {confirmDiscard.type === 'all'
                ? 'Discard All Changes?'
                : confirmDiscard.isNew
                  ? `Delete "${confirmDiscard.name}"?`
                  : `Discard changes to "${confirmDiscard.name}"?`}
            </h3>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>
              {confirmDiscard.type === 'all'
                ? `This will discard ${discardableCount} change(s). Deletions will remain pending. This cannot be undone.`
                : confirmDiscard.isNew
                  ? 'This gallery was never published and will be permanently deleted.'
                  : 'Your edits will be lost and the item will be restored to its last published state.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDiscard(null)}
                className="admin-btn-secondary"
                disabled={discarding}
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="admin-btn"
                disabled={discarding}
                style={{ background: '#dc3545' }}
              >
                {discarding ? 'Processing...' : confirmDiscard.isNew ? 'Delete' : 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

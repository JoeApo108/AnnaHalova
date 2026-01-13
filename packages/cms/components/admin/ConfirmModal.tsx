'use client'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3 className="admin-modal-title">{title}</h3>
        <p className="admin-modal-message">{message}</p>
        <div className="admin-modal-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="admin-btn"
            style={variant === 'danger' ? { background: '#dc2626' } : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ'
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const bgColor = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  }[toast.type]

  return (
    <div
      className={`admin-toast admin-toast-${toast.type}`}
      style={{ backgroundColor: bgColor }}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="admin-toast-icon">{icons[toast.type]}</span>
      {toast.message}
    </div>
  )
}

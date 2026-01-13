'use client'

import { useState } from 'react'
import { useToast } from '@/components/admin/ToastProvider'

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()

      if (res.ok) {
        showToast('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showToast(data.error || 'Failed to change password', 'error')
      }
    } catch {
      showToast('Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Settings</h1>

      <div className="admin-card" style={{ maxWidth: '500px' }}>
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Current Password</label>
            <input
              type="password"
              className="admin-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">New Password</label>
            <input
              type="password"
              className="admin-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <small className="text-secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Minimum 8 characters
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Confirm New Password</label>
            <input
              type="password"
              className="admin-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="admin-btn"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          >
            {saving ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

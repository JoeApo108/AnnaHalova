// app/admin/theme/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { ColorInput } from '@/components/admin/ColorInput'

interface ThemeSetting {
  key: string
  value: string
  category: string
  label: string
}

const defaultTheme: Record<string, string> = {
  'color-text': '#2d4a3d',
  'color-text-light': '#4a6b5a',
  'color-bg': '#fefefe',
  'color-bg-alt': '#f5f5f3',
  'color-accent': '#2d4a3d',
  'color-border': '#e0e0dc'
}

export default function ThemePage() {
  const [settings, setSettings] = useState<ThemeSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchTheme = useCallback(async () => {
    const res = await fetch('/api/theme')
    const data = await res.json()
    setSettings(data.settings)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTheme()
  }, [fetchTheme])

  function updateSetting(key: string, value: string) {
    setSettings(prev => prev.map(s =>
      s.key === key ? { ...s, value } : s
    ))
    setHasChanges(true)
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    })
    setSaving(false)
    setHasChanges(false)
  }

  function handleReset() {
    setSettings(prev => prev.map(s => ({
      ...s,
      value: defaultTheme[s.key] || s.value
    })))
    setHasChanges(true)
  }

  const colors = settings.filter(s => s.category === 'colors')
  const typography = settings.filter(s => s.category === 'typography')

  // Generate preview styles
  const previewStyles = settings.reduce((acc, s) => {
    acc[`--${s.key}`] = s.value
    return acc
  }, {} as Record<string, string>)

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Theme Settings</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleReset} className="admin-btn admin-btn-secondary">
            Reset to Defaults
          </button>
          <button onClick={handleSave} className="admin-btn" disabled={!hasChanges || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Settings */}
        <div>
          <div className="admin-card">
            <h2>Colors</h2>
            {colors.map(setting => (
              <ColorInput
                key={setting.key}
                label={setting.label}
                value={setting.value}
                onChange={(v) => updateSetting(setting.key, v)}
              />
            ))}
          </div>

          <div className="admin-card">
            <h2>Typography</h2>
            {typography.map(setting => (
              <div key={setting.key} className="admin-form-group">
                <label className="admin-label">{setting.label}</label>
                <input
                  type="text"
                  className="admin-input"
                  value={setting.value}
                  onChange={(e) => updateSetting(setting.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="admin-card">
          <h2>Preview</h2>
          <div
            style={{
              ...previewStyles,
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)'
            } as React.CSSProperties}
          >
            <h1 style={{ color: 'var(--color-text)', fontFamily: 'var(--font-primary)', marginBottom: '16px' }}>
              Anna Hálová
            </h1>
            <nav style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
              Malby · Akvarely · O mně · Kontakt
            </nav>
            <div style={{ background: 'var(--color-bg-alt)', padding: '16px', borderRadius: '6px' }}>
              <p style={{ color: 'var(--color-text)', fontFamily: 'var(--font-primary)' }}>
                Ukázka textu demonstrující zvolenou typografii a barevné schéma.
              </p>
            </div>
            <button
              style={{
                marginTop: '16px',
                background: 'var(--color-accent)',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              Accent Button
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

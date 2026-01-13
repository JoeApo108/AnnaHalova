// components/admin/ColorInput.tsx
'use client'

import { useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="admin-form-group">
      <label className="admin-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            border: '2px solid #ddd',
            background: value,
            cursor: 'pointer'
          }}
        />
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          style={{
            width: '100px',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '6px'
          }}
        />
      </div>

      {showPicker && (
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={() => setShowPicker(false)}
          />
          <div style={{ position: 'absolute', marginTop: '8px' }}>
            <HexColorPicker color={value} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  )
}

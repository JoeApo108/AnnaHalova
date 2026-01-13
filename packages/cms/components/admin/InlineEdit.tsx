'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface InlineEditProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  label: string
  placeholder?: string
}

/**
 * Inline editing component for quick edits without page navigation.
 *
 * Features:
 * - Click to enter edit mode
 * - Enter to save, Escape to cancel
 * - Blur (click outside) saves changes
 * - Shows loading state during save
 * - Reverts on error
 *
 * @example
 * <InlineEdit
 *   value={artwork.title_cs}
 *   label="Czech title"
 *   onSave={async (newTitle) => {
 *     await updateArtwork({ ...artwork, title_cs: newTitle })
 *   }}
 * />
 */
export function InlineEdit({ value, onSave, label, placeholder = 'Click to edit' }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync local value when prop changes (e.g., after list refresh)
  useEffect(() => {
    if (!isEditing) {
      setCurrentValue(value)
    }
  }, [value, isEditing])

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = useCallback(async () => {
    // No changes - just close
    if (currentValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(currentValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Inline edit save error:', error)
      // Revert to original value on error
      setCurrentValue(value)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }, [currentValue, value, onSave])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setCurrentValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        aria-label={label}
        className="inline-edit__input"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="inline-edit__display"
      aria-label={`Edit ${label}. Current value: ${value || 'empty'}`}
    >
      {value || <span className="inline-edit__placeholder">{placeholder}</span>}
    </button>
  )
}

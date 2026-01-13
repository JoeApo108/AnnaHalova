'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SortableItem } from './SortableItem'

interface Artwork {
  id: string
  filename: string
  title_cs: string
  title_en: string
  thumbnail_url?: string
  position: number
}

interface GalleryEditorProps {
  galleryId: string
  initialItems: Artwork[]
  onOrderChange?: (items: Artwork[]) => void
  onItemsChange?: (items: Artwork[]) => void
  onAddClick?: () => void
}

export function GalleryEditor({ galleryId, initialItems, onOrderChange, onItemsChange, onAddClick }: GalleryEditorProps) {
  const [items, setItems] = useState(initialItems)
  const [isSaving, setIsSaving] = useState(false)

  // Sync items when initialItems prop changes (e.g., after adding artwork)
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newOrder = arrayMove(items, oldIndex, newIndex)
      setItems(newOrder)
      onOrderChange?.(newOrder)

      // Save to API
      setIsSaving(true)
      await fetch(`/api/galleries/${galleryId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: newOrder.map((item, idx) => ({
            id: item.id,
            position: idx
          }))
        })
      })
      setIsSaving(false)
      // Notify footer to update pending changes count
      window.dispatchEvent(new CustomEvent('content-changed'))
    }
  }

  async function handleRemove(artworkId: string) {
    setIsSaving(true)

    const res = await fetch(`/api/galleries/${galleryId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId })
    })

    if (res.ok) {
      const newItems = items.filter(item => item.id !== artworkId)
      setItems(newItems)
      onItemsChange?.(newItems)
      // Notify footer to update pending changes count
      window.dispatchEvent(new CustomEvent('content-changed'))
    }

    setIsSaving(false)
  }

  // Allow adding items programmatically (exposed for external use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _addItem(item: Artwork) {
    setItems(prev => [...prev, item])
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Gallery Items ({items.length})</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSaving && <span className="text-secondary" style={{ fontSize: '14px' }}>Saving...</span>}
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              + Add Artwork
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
          No items in this gallery. Add artworks to get started.
        </p>
      )}
    </div>
  )
}

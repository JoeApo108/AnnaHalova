'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Artwork {
  id: string
  filename: string
  title_cs: string
  title_en: string
  thumbnail_url?: string
}

interface SortableItemProps {
  item: Artwork
  onRemove: () => void
}

export function SortableItem({ item, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      className="sortable-item"
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '6px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-secondary"
        style={{
          cursor: 'grab',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          touchAction: 'none'
        }}
      >
        ≡
      </button>

      {/* Thumbnail */}
      <div
        className="item-thumbnail"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '4px',
          backgroundImage: item.thumbnail_url ? `url(${item.thumbnail_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0
        }}
      />

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title_cs}
        </div>
        <div className="text-secondary" style={{ fontSize: '12px' }}>
          {item.title_en}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="text-muted"
        style={{
          padding: '4px 8px',
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
    </div>
  )
}

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = '4px',
  className
}: SkeletonProps) {
  return (
    <div
      className={`admin-skeleton ${className || ''}`}
      style={{ width, height, borderRadius }}
    />
  )
}

export function SkeletonRow() {
  return (
    <tr>
      <td style={{ padding: '12px' }}>
        <Skeleton width={16} height={16} borderRadius="2px" />
      </td>
      <td style={{ padding: '12px' }}>
        <Skeleton width={60} height={60} borderRadius="4px" />
      </td>
      <td style={{ padding: '12px' }}>
        <Skeleton height={16} width="70%" />
        <Skeleton height={12} width="50%" className="mt-2" />
      </td>
      <td style={{ padding: '12px' }}><Skeleton width={40} /></td>
      <td style={{ padding: '12px' }}><Skeleton width={80} /></td>
      <td style={{ padding: '12px' }}><Skeleton width={60} /></td>
      <td style={{ padding: '12px' }}><Skeleton width={50} height={32} /></td>
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height={18} width="60%" />
      <Skeleton height={12} width="40%" className="mt-2" />
    </div>
  )
}

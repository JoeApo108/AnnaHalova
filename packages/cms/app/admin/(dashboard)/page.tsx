// app/admin/page.tsx
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  const artworkCount = await env.DB.prepare('SELECT COUNT(*) as count FROM artworks').first<{count: number}>()
  const galleryCount = await env.DB.prepare('SELECT COUNT(*) as count FROM galleries').first<{count: number}>()

  const stats = {
    artworks: artworkCount?.count || 0,
    galleries: galleryCount?.count || 0
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      <div className="dashboard-stats-grid">
        <div className="admin-card" style={{ textAlign: 'center' }}>
          <div className="text-brand" style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.artworks}</div>
          <div className="text-secondary">Artworks</div>
        </div>
        <div className="admin-card" style={{ textAlign: 'center' }}>
          <div className="text-brand" style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.galleries}</div>
          <div className="text-secondary">Galleries</div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Quick Actions</h2>
        <div className="dashboard-actions">
          <Link href="/admin/artworks/new" className="admin-btn">
            + Add Artwork
          </Link>
          <Link href="/admin/galleries/new" className="admin-btn admin-btn-secondary">
            + Create Gallery
          </Link>
          <Link href="/admin/publish" className="admin-btn admin-btn-secondary">
            Publish Site
          </Link>
        </div>
      </div>
    </div>
  )
}

import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/publish/pending/route.ts
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }

  // Security: Require authentication - this endpoint leaks internal data
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  try {
    // Get last successful publish time
    const lastPublish = await env.DB.prepare(`
      SELECT MAX(published_at) as last_publish FROM publish_log WHERE status = 'success'
    `).first<{ last_publish: number | null }>()

    const lastPublishTime = lastPublish?.last_publish || 0

    // Get modified galleries since last publish (new or edited)
    // Note: Standalone artwork edits are NOT tracked - artworks only matter when in galleries
    const modifiedGalleries = await env.DB.prepare(`
      SELECT id, name_cs, type,
        CASE WHEN created_at > ? THEN 'new' ELSE 'edit' END as change_type
      FROM galleries WHERE updated_at > ?
    `).bind(lastPublishTime, lastPublishTime).all()

    // Get deleted items that haven't been published yet
    const deletions = await env.DB.prepare(`
      SELECT id, item_type, item_id, item_name FROM deletion_log WHERE published_at IS NULL
    `).all()

    // Get theme changes since last publish
    const themeChanges = await env.DB.prepare(`
      SELECT key, label FROM theme_settings WHERE updated_at > ?
    `).bind(lastPublishTime).all()

    const galleries = modifiedGalleries.results || []
    const deleted = deletions.results || []
    const theme = themeChanges.results || []

    return Response.json({
      pending: {
        galleries,
        deletions: deleted,
        theme,
        total: galleries.length + deleted.length + theme.length
      },
      lastPublish: lastPublishTime ? new Date(lastPublishTime * 1000).toISOString() : null
    })
  } catch (error) {
    console.error('Get pending changes error:', error)
    return Response.json({ error: 'Failed to load pending changes' }, { status: 500 })
  }
}

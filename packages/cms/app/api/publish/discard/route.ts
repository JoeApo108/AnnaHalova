// app/api/publish/discard/route.ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAuth } from '@/lib/auth'

interface DiscardRequest {
  type?: 'gallery' | 'theme'
  id?: string      // For gallery
  key?: string     // For theme setting
  all?: boolean    // Discard all pending changes
}

interface GallerySnapshot {
  slug: string
  type: string
  name_cs: string
  name_en: string
  description_cs: string | null
  description_en: string | null
  category: string | null
  year: number | null
  series_key: string | null
  is_visible: number
  sort_order: number
  artwork_ids: string[]
}

interface ThemeSnapshot {
  value: string
}

interface GalleryRow {
  id: string
  published_snapshot: string | null
  created_at: number
}

interface ThemeRow {
  key: string
  published_snapshot: string | null
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  try {
    const body: DiscardRequest = await request.json()

    // Get last publish time for determining what's "pending"
    const lastPublish = await env.DB.prepare(`
      SELECT MAX(published_at) as last_publish FROM publish_log WHERE status = 'success'
    `).first<{ last_publish: number | null }>()
    const lastPublishTime = lastPublish?.last_publish || 0

    // Discard all pending changes
    if (body.all) {
      const discarded = await discardAllPending(env, lastPublishTime)
      return Response.json({ success: true, discarded })
    }

    // Discard single gallery
    if (body.type === 'gallery' && body.id) {
      const result = await discardGallery(env, body.id, lastPublishTime)
      if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: 400 })
      }
      return Response.json({ success: true, discarded: 1 })
    }

    // Discard single theme setting
    if (body.type === 'theme' && body.key) {
      const result = await discardThemeSetting(env, body.key)
      if (!result.success) {
        return Response.json({ success: false, error: result.error }, { status: 400 })
      }
      return Response.json({ success: true, discarded: 1 })
    }

    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 })

  } catch (error) {
    console.error('Discard error:', error)
    return Response.json({ success: false, error: 'Failed to discard changes' }, { status: 500 })
  }
}

async function discardGallery(
  env: CloudflareEnv,
  galleryId: string,
  lastPublishTime: number
): Promise<{ success: boolean; error?: string }> {
  // Get the gallery with its snapshot
  const gallery = await env.DB.prepare(`
    SELECT id, published_snapshot, created_at FROM galleries WHERE id = ?
  `).bind(galleryId).first<GalleryRow>()

  if (!gallery) {
    return { success: false, error: 'Gallery not found' }
  }

  // Check if this is a NEW gallery (created after last publish, no snapshot)
  const isNew = !gallery.published_snapshot || gallery.created_at > lastPublishTime

  if (isNew) {
    // Delete the new gallery entirely
    await env.DB.prepare('DELETE FROM gallery_items WHERE gallery_id = ?').bind(galleryId).run()
    await env.DB.prepare('DELETE FROM galleries WHERE id = ?').bind(galleryId).run()
    return { success: true }
  }

  // Restore from snapshot for EDIT
  const snapshot: GallerySnapshot = JSON.parse(gallery.published_snapshot)

  // Update gallery fields
  await env.DB.prepare(`
    UPDATE galleries SET
      slug = ?, type = ?, name_cs = ?, name_en = ?,
      description_cs = ?, description_en = ?, category = ?,
      year = ?, series_key = ?, is_visible = ?, sort_order = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    snapshot.slug,
    snapshot.type,
    snapshot.name_cs,
    snapshot.name_en,
    snapshot.description_cs,
    snapshot.description_en,
    snapshot.category,
    snapshot.year,
    snapshot.series_key,
    snapshot.is_visible,
    snapshot.sort_order,
    lastPublishTime - 1, // Set updated_at before last publish to remove from pending
    galleryId
  ).run()

  // Restore artwork assignments
  await env.DB.prepare('DELETE FROM gallery_items WHERE gallery_id = ?').bind(galleryId).run()

  for (let i = 0; i < snapshot.artwork_ids.length; i++) {
    const artworkId = snapshot.artwork_ids[i]
    await env.DB.prepare(`
      INSERT INTO gallery_items (id, gallery_id, artwork_id, position)
      VALUES (?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      galleryId,
      artworkId,
      i
    ).run()
  }

  return { success: true }
}

async function discardThemeSetting(
  env: CloudflareEnv,
  key: string
): Promise<{ success: boolean; error?: string }> {
  const setting = await env.DB.prepare(`
    SELECT key, published_snapshot FROM theme_settings WHERE key = ?
  `).bind(key).first<ThemeRow>()

  if (!setting) {
    return { success: false, error: 'Theme setting not found' }
  }

  if (!setting.published_snapshot) {
    return { success: false, error: 'Cannot discard - setting was never published' }
  }

  const snapshot: ThemeSnapshot = JSON.parse(setting.published_snapshot)

  // Get last publish time
  const lastPublish = await env.DB.prepare(`
    SELECT MAX(published_at) as last_publish FROM publish_log WHERE status = 'success'
  `).first<{ last_publish: number | null }>()
  const lastPublishTime = lastPublish?.last_publish || 0

  await env.DB.prepare(`
    UPDATE theme_settings SET value = ?, updated_at = ? WHERE key = ?
  `).bind(snapshot.value, lastPublishTime - 1, key).run()

  return { success: true }
}

async function discardAllPending(env: CloudflareEnv, lastPublishTime: number): Promise<number> {
  let discardedCount = 0

  // Get all pending galleries
  const pendingGalleries = await env.DB.prepare(`
    SELECT id FROM galleries WHERE updated_at > ?
  `).bind(lastPublishTime).all()

  for (const gallery of pendingGalleries.results as { id: string }[]) {
    const result = await discardGallery(env, gallery.id, lastPublishTime)
    if (result.success) discardedCount++
  }

  // Get all pending theme settings
  const pendingTheme = await env.DB.prepare(`
    SELECT key FROM theme_settings WHERE updated_at > ?
  `).bind(lastPublishTime).all()

  for (const setting of pendingTheme.results as { key: string }[]) {
    const result = await discardThemeSetting(env, setting.key)
    if (result.success) discardedCount++
  }

  return discardedCount
}

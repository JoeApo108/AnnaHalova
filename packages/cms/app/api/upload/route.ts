import { getCloudflareContext } from '@opennextjs/cloudflare'
// app/api/upload/route.ts
import { requireAuth } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Security: Magic bytes (file signatures) for image validation
// This prevents uploading malicious files disguised as images
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP also has 'WEBP' at offset 8)
}

async function validateMagicBytes(file: File | Blob, mimeType: string): Promise<boolean> {
  const expectedSignatures = MAGIC_BYTES[mimeType]
  if (!expectedSignatures) return false

  // Read the first 12 bytes to check signature
  const buffer = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  for (const signature of expectedSignatures) {
    let matches = true
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        matches = false
        break
      }
    }
    if (matches) {
      // Additional check for WebP: verify 'WEBP' at offset 8
      if (mimeType === 'image/webp') {
        const webpSignature = [0x57, 0x45, 0x42, 0x50] // 'WEBP'
        for (let i = 0; i < 4; i++) {
          if (bytes[8 + i] !== webpSignature[i]) return false
        }
      }
      return true
    }
  }
  return false
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext() as { env: CloudflareEnv }
  const user = await requireAuth(request, env)
  if (user instanceof Response) return user

  // Rate limiting: 10 uploads per minute per user
  const rateLimit = checkRateLimit(user.id, 'upload')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit)
  }

  const formData = await request.formData()
  const artworkId = formData.get('artworkId') as string

  // Support both old format (single 'file') and new format (original, thumb, full)
  const original = formData.get('original') as File | null
  const thumb = formData.get('thumb') as Blob | null
  const full = formData.get('full') as Blob | null
  const legacyFile = formData.get('file') as File | null

  const mainFile = original || legacyFile
  if (!mainFile) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // Security: Validate artworkId format
  if (artworkId && artworkId !== 'new') {
    if (!/^[a-zA-Z0-9-]{1,8}$/.test(artworkId)) {
      return Response.json({ error: 'Invalid artwork ID format' }, { status: 400 })
    }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(mainFile.type)) {
    return Response.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 })
  }

  // Validate file size (10MB max for original)
  if (mainFile.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
  }

  // Validate magic bytes on original
  const validMagicBytes = await validateMagicBytes(mainFile, mainFile.type)
  if (!validMagicBytes) {
    return Response.json({ error: 'File content does not match expected image format.' }, { status: 400 })
  }

  const timestamp = Date.now()
  const ext = (mainFile.name.split('.').pop() || 'jpg').toLowerCase()
  const baseFilename = artworkId && artworkId !== 'new'
    ? artworkId
    : String(timestamp)

  try {
    const uploads: Promise<unknown>[] = []

    // Upload original (keep original extension)
    const originalFilename = `${baseFilename}.${ext}`
    uploads.push(
      env.R2.put(`originals/${originalFilename}`, await mainFile.arrayBuffer(), {
        httpMetadata: { contentType: mainFile.type }
      })
    )

    // Upload thumbnail (always JPEG from canvas)
    const thumbFilename = `${baseFilename}.jpg`
    if (thumb) {
      uploads.push(
        env.R2.put(`images/thumbs/${thumbFilename}`, await thumb.arrayBuffer(), {
          httpMetadata: { contentType: 'image/jpeg' }
        })
      )
    } else {
      // Fallback: use original if no thumb provided
      uploads.push(
        env.R2.put(`images/thumbs/${thumbFilename}`, await mainFile.arrayBuffer(), {
          httpMetadata: { contentType: mainFile.type }
        })
      )
    }

    // Upload full-size (always JPEG from canvas)
    if (full) {
      uploads.push(
        env.R2.put(`images/full/${thumbFilename}`, await full.arrayBuffer(), {
          httpMetadata: { contentType: 'image/jpeg' }
        })
      )
    } else {
      // Fallback: use original if no full provided
      uploads.push(
        env.R2.put(`images/full/${thumbFilename}`, await mainFile.arrayBuffer(), {
          httpMetadata: { contentType: mainFile.type }
        })
      )
    }

    await Promise.all(uploads)

    // Use jpg extension for database since thumb/full are JPEG
    const filename = thumbFilename
    const imageUrl = `/api/images/originals/${originalFilename}`

    // Update artwork if ID provided
    if (artworkId && artworkId !== 'new') {
      await env.DB.prepare(`
        UPDATE artworks
        SET filename = ?, image_url = ?, updated_at = unixepoch()
        WHERE id = ?
      `).bind(filename, imageUrl, artworkId).run()
    }

    return Response.json({
      success: true,
      filename,
      url: imageUrl
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

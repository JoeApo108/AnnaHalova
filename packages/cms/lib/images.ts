/**
 * Shared image URL helper. Builds path from filename and type.
 * Passes through R2 API and external URLs unchanged.
 * Uses the R2-backed /api/images route (immutable-cached) so CMS uploads,
 * which exist only in R2 and not in public/, resolve in preview too.
 */
export function getImageSrc(filename: string, type: 'thumbs' | 'full'): string {
  if (filename.startsWith('/api/') || filename.startsWith('http')) {
    return filename
  }
  return `/api/images/${type}/${filename}`
}

/**
 * Shared image URL helper. Builds path from filename and type.
 * Passes through R2 API and external URLs unchanged.
 */
export function getImageSrc(filename: string, type: 'thumbs' | 'full'): string {
  if (filename.startsWith('/api/') || filename.startsWith('http')) {
    return filename
  }
  return `/images/${type}/${filename}`
}

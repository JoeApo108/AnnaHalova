'use client'
import { useEffect, useState } from 'react'

/**
 * Hook to detect the platform's modifier key symbol.
 * Returns ⌘ on Mac, Ctrl on Windows/Linux.
 *
 * Uses navigator.platform for reliable detection.
 * Defaults to "Ctrl" for SSR and unknown platforms.
 */
export function usePlatformModKey(): '⌘' | 'Ctrl' {
  // Default to Ctrl for SSR hydration safety
  const [modKey, setModKey] = useState<'⌘' | 'Ctrl'>('Ctrl')

  useEffect(() => {
    // Check if running on Mac (macOS, iPad, iPhone)
    const platform = navigator.platform?.toUpperCase() || ''
    const isMac = platform.includes('MAC') ||
                  platform.includes('IPHONE') ||
                  platform.includes('IPAD')

    setModKey(isMac ? '⌘' : 'Ctrl')
  }, [])

  return modKey
}

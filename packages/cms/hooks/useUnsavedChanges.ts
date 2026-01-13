'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook to track unsaved form changes and warn users before navigation.
 *
 * Features:
 * - Compares current state to initial state using JSON serialization
 * - Shows browser "beforeunload" warning when navigating away with changes
 * - Provides visual indicator state (hasChanges)
 * - resetInitialState() to clear warning after save
 *
 * @param currentState - The current form state object to track
 * @param enabled - Whether to enable the beforeunload warning (disable during save)
 */
export function useUnsavedChanges<T extends object>(
  currentState: T,
  enabled: boolean = true,
  isReady: boolean = true
) {
  const initialStateRef = useRef<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Serialize state for comparison (handles nested objects)
  const serialize = useCallback((state: T): string => {
    return JSON.stringify(state)
  }, [])

  // Capture initial state only when data is ready
  useEffect(() => {
    if (initialStateRef.current === null && currentState && isReady) {
      initialStateRef.current = serialize(currentState)
    }
  }, [currentState, serialize, isReady])

  // Detect changes by comparing serialized states
  useEffect(() => {
    if (!initialStateRef.current) return

    const currentSerialized = serialize(currentState)
    const changed = currentSerialized !== initialStateRef.current
    setHasChanges(changed)
  }, [currentState, serialize])

  // Browser warning for refresh/close/navigation
  useEffect(() => {
    if (!enabled || !hasChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Chrome requires returnValue to be set
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges, enabled])

  // Reset function - call after successful save
  const resetInitialState = useCallback(() => {
    initialStateRef.current = serialize(currentState)
    setHasChanges(false)
  }, [currentState, serialize])

  return { hasChanges, resetInitialState }
}

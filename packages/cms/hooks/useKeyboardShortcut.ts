import { useEffect } from 'react'

type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt'

interface ShortcutConfig {
  key: string
  modifiers?: ModifierKey[]
  handler: () => void
  preventDefault?: boolean
}

export function useKeyboardShortcut(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        const modifiersMatch =
          (!shortcut.modifiers?.includes('ctrl') || e.ctrlKey) &&
          (!shortcut.modifiers?.includes('meta') || e.metaKey) &&
          (!shortcut.modifiers?.includes('shift') || e.shiftKey) &&
          (!shortcut.modifiers?.includes('alt') || e.altKey)

        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatches && modifiersMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault()
          }
          shortcut.handler()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

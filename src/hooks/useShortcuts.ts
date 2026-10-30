import { useEffect } from 'react'
import type { TabMode } from '../types.ts'

interface UseShortcutsParams {
  activeTab: TabMode
  onToggleActive: () => void
  onResetActive: () => void
  onLapStopwatch: () => void
}

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  if (target.isContentEditable) {
    return true
  }
  const interactiveSelector =
    'button, input, textarea, select, a[href], summary, [role="button"], [role="tab"], [role="link"], [role="checkbox"], [role="switch"], [tabindex]:not([tabindex="-1"])'
  return target.closest(interactiveSelector) !== null
}

/**
 * Global keyboard shortcuts:
 * - Space: start/pause active clock
 * - R: reset active clock
 * - L: lap stopwatch (when on stopwatch tab and running)
 * Ignored when focus is on an interactive element or when modifier keys/repeats are active.
 */
export function useShortcuts({
  activeTab,
  onToggleActive,
  onResetActive,
  onLapStopwatch,
}: UseShortcutsParams): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
        return
      }
      if (isInteractiveElement(event.target)) {
        return
      }

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        onToggleActive()
        return
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        onResetActive()
        return
      }

      if (
        (event.key === 'l' || event.key === 'L') &&
        activeTab === 'stopwatch'
      ) {
        event.preventDefault()
        onLapStopwatch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeTab, onToggleActive, onResetActive, onLapStopwatch])
}

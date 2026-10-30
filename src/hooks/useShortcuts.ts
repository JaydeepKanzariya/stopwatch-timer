import { useEffect } from 'react'
import type { TabMode } from '../types.ts'

interface UseShortcutsParams {
  activeTab: TabMode
  onToggleActive: () => void
  onResetActive: () => void
  onLapStopwatch: () => void
}

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select') !== null
  )
}

function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.closest(
      'button, a[href], summary, [role="button"], [role="tab"], [role="link"]',
    ) !== null
  )
}

/**
 * Global keyboard shortcuts:
 * - Space: start/pause active clock
 * - R: reset active clock
 * - L: lap stopwatch (when on stopwatch tab and running)
 * All are ignored inside text fields; Space is also ignored on buttons/tabs/links
 * (the browser activates them). Modifier combos and key repeats are ignored.
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
      if (isTextField(event.target)) {
        return
      }

      if (event.code === 'Space' || event.key === ' ') {
        if (isActivatable(event.target)) {
          return
        }
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

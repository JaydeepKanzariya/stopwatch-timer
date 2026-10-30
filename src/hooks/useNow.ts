import { useEffect, useState } from 'react'

/**
 * Provides a ticking high-resolution timestamp (`performance.now()`) while `active` is true.
 * Uses requestAnimationFrame for smooth foreground rendering plus a lightweight interval
 * and visibilitychange listener so background tabs remain accurate and responsive.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState<number>(() => performance.now())

  useEffect(() => {
    if (!active) {
      return undefined
    }

    let frameId = 0

    const tickFrame = () => {
      setNow(performance.now())
      frameId = window.requestAnimationFrame(tickFrame)
    }

    frameId = window.requestAnimationFrame(tickFrame)

    // Keep ticking in background tabs where requestAnimationFrame is paused
    const intervalId = window.setInterval(() => {
      setNow(performance.now())
    }, 40)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNow(performance.now())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [active])

  return now
}

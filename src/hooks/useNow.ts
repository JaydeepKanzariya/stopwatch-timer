import { useEffect, useState } from 'react'

/**
 * Provides a ticking high-resolution timestamp (`performance.now()`) while `active` is true.
 * Uses requestAnimationFrame while the page is visible and a 40 ms interval only while
 * it is hidden (rAF is paused there), so the app never renders twice per frame.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState<number>(() => performance.now())

  useEffect(() => {
    if (!active) {
      return undefined
    }

    let frameId = 0
    let intervalId = 0

    const tickFrame = () => {
      setNow(performance.now())
      frameId = window.requestAnimationFrame(tickFrame)
    }

    const startLoop = () => {
      window.cancelAnimationFrame(frameId)
      window.clearInterval(intervalId)
      setNow(performance.now())
      if (document.visibilityState === 'hidden') {
        intervalId = window.setInterval(() => {
          setNow(performance.now())
        }, 40)
      } else {
        frameId = window.requestAnimationFrame(tickFrame)
      }
    }

    startLoop()
    document.addEventListener('visibilitychange', startLoop)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', startLoop)
    }
  }, [active])

  return now
}

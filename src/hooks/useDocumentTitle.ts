import { useEffect, useRef } from 'react'
import { formatCompactSeconds } from '../lib/time.ts'

interface UseDocumentTitleParams {
  stopwatchRunning: boolean
  stopwatchElapsedMs: number
  timerRunning: boolean
  timerRemainingMs: number
}

/**
 * Updates document.title at most once per second while any clock is running
 * (preferring the timer when both run), and restores the original title when idle or unmounted.
 */
export function useDocumentTitle({
  stopwatchRunning,
  stopwatchElapsedMs,
  timerRunning,
  timerRemainingMs,
}: UseDocumentTitleParams): void {
  const defaultTitleRef = useRef<string>(
    typeof document !== 'undefined' && document.title
      ? document.title
      : 'Stopwatch & Timer',
  )

  const timerWholeSeconds = timerRunning
    ? Math.ceil(Math.max(0, timerRemainingMs) / 1000)
    : 0

  const stopwatchWholeSeconds = stopwatchRunning
    ? Math.floor(Math.max(0, stopwatchElapsedMs) / 1000)
    : 0

  useEffect(() => {
    if (timerRunning) {
      document.title = `${formatCompactSeconds(timerWholeSeconds)} · Timer`
      return
    }

    if (stopwatchRunning) {
      document.title = `${formatCompactSeconds(stopwatchWholeSeconds)} · Stopwatch`
      return
    }

    document.title = defaultTitleRef.current
  }, [
    timerRunning,
    timerWholeSeconds,
    stopwatchRunning,
    stopwatchWholeSeconds,
  ])

  useEffect(() => {
    const originalTitle = defaultTitleRef.current
    return () => {
      document.title = originalTitle
    }
  }, [])
}

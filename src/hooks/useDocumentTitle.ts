import { useEffect, useRef } from 'react'
import { formatCompactSeconds } from '../lib/time.ts'

interface UseDocumentTitleParams {
  stopwatchRunning: boolean
  stopwatchElapsedMs: number
  timerRunning: boolean
  timerRemainingMs: number
  timerFinished: boolean
}

/**
 * Updates document.title at most once per second while any clock is running
 * (preferring the timer when both run). Shows "Time's up" once the timer has
 * finished so it is visible from another tab. Restores the original title when
 * idle or unmounted.
 */
export function useDocumentTitle({
  stopwatchRunning,
  stopwatchElapsedMs,
  timerRunning,
  timerRemainingMs,
  timerFinished,
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
    if (timerFinished) {
      document.title = "Time's up · Timer"
      return
    }

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
    timerFinished,
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

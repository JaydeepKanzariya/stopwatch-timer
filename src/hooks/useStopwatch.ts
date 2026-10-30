import { useCallback, useReducer } from 'react'
import { getLapExtremes } from '../lib/laps.ts'
import { formatStopwatch } from '../lib/time.ts'
import type { ClockStatus, Lap, LapExtremes } from '../types.ts'
import { useNow } from './useNow.ts'

export interface StopwatchState {
  status: Extract<ClockStatus, 'idle' | 'running' | 'paused'>
  accumulatedMs: number
  startedAt: number | null
  laps: Lap[]
}

export type StopwatchAction =
  | { type: 'START'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESET' }
  | { type: 'LAP'; now: number }

const INITIAL_STATE: StopwatchState = {
  status: 'idle',
  accumulatedMs: 0,
  startedAt: null,
  laps: [],
}

export function stopwatchReducer(
  state: StopwatchState,
  action: StopwatchAction,
): StopwatchState {
  switch (action.type) {
    case 'START': {
      if (state.status === 'running') {
        return state
      }
      return {
        ...state,
        status: 'running',
        startedAt: action.now,
      }
    }

    case 'PAUSE': {
      if (state.status !== 'running' || state.startedAt === null) {
        return state
      }
      const delta = Math.max(0, action.now - state.startedAt)
      return {
        ...state,
        status: 'paused',
        accumulatedMs: state.accumulatedMs + delta,
        startedAt: null,
      }
    }

    case 'RESET': {
      return INITIAL_STATE
    }

    case 'LAP': {
      if (state.status !== 'running' || state.startedAt === null) {
        return state
      }
      const totalMs =
        state.accumulatedMs + Math.max(0, action.now - state.startedAt)
      const previousTotalMs = state.laps.length > 0 ? state.laps[0].totalMs : 0
      const splitMs = Math.max(0, totalMs - previousTotalMs)
      const nextLapNumber = state.laps.length + 1
      const nextLap: Lap = {
        id: nextLapNumber,
        lapNumber: nextLapNumber,
        splitMs,
        totalMs,
      }
      return {
        ...state,
        laps: [nextLap, ...state.laps],
      }
    }
  }
}

export interface UseStopwatchResult {
  status: StopwatchState['status']
  elapsedMs: number
  formattedTime: string
  laps: readonly Lap[]
  lapExtremes: LapExtremes
  canReset: boolean
  canLap: boolean
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  lap: () => void
}

export function useStopwatch(): UseStopwatchResult {
  const [state, dispatch] = useReducer(stopwatchReducer, INITIAL_STATE)
  const isRunning = state.status === 'running'
  const now = useNow(isRunning)

  const elapsedMs =
    state.accumulatedMs +
    (isRunning && state.startedAt !== null
      ? Math.max(0, now - state.startedAt)
      : 0)

  const formattedTime = formatStopwatch(elapsedMs)
  const lapExtremes = getLapExtremes(state.laps)
  const canReset = state.status !== 'idle' || state.accumulatedMs > 0
  const canLap = isRunning

  const start = useCallback(() => {
    dispatch({ type: 'START', now: performance.now() })
  }, [])

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE', now: performance.now() })
  }, [])

  const toggle = useCallback(() => {
    if (isRunning) {
      dispatch({ type: 'PAUSE', now: performance.now() })
    } else {
      dispatch({ type: 'START', now: performance.now() })
    }
  }, [isRunning])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const lap = useCallback(() => {
    dispatch({ type: 'LAP', now: performance.now() })
  }, [])

  return {
    status: state.status,
    elapsedMs,
    formattedTime,
    laps: state.laps,
    lapExtremes,
    canReset,
    canLap,
    start,
    pause,
    toggle,
    reset,
    lap,
  }
}

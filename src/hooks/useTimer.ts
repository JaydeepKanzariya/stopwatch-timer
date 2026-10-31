import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  closeAudioContext,
  playTimerBeep,
  unlockAudioContext,
} from '../lib/beep.ts'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showTimerNotification,
  vibrateOnFinish,
  type NotifyPermission,
} from '../lib/notify.ts'
import { fromTimerSnapshot, toTimerSnapshot } from '../lib/persist.ts'
import {
  loadMuted,
  loadNotify,
  loadTimerDuration,
  loadTimerSnapshot,
  saveMuted,
  saveNotify,
  saveTimerDuration,
  saveTimerSnapshot,
} from '../lib/storage.ts'
import { clampField, formatTimer, toMs } from '../lib/time.ts'
import type { ClockStatus, TimeParts, TimerState } from '../types.ts'
import { useNow } from './useNow.ts'

export type TimerAction =
  | { type: 'SET_FIELD'; field: keyof TimeParts; rawValue: string | number }
  | { type: 'SET_PRESET'; minutes: number }
  | { type: 'START'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESET' }
  | { type: 'FINISH' }

function createInitialTimerState(): TimerState {
  const inputs = loadTimerDuration()
  const durationMs = toMs(inputs)
  const idle: TimerState = {
    status: 'idle',
    inputs,
    durationMs,
    remainingMs: durationMs,
    endAt: null,
    runId: 0,
  }
  const snapshot = loadTimerSnapshot()
  return snapshot
    ? fromTimerSnapshot(snapshot, idle, performance.now(), Date.now())
    : idle
}

function withInputs(state: TimerState, nextInputs: TimeParts): TimerState {
  const nextDurationMs = toMs(nextInputs)
  return {
    ...state,
    status: 'idle',
    inputs: nextInputs,
    durationMs: nextDurationMs,
    remainingMs: nextDurationMs,
    endAt: null,
  }
}

function isEditable(status: ClockStatus): boolean {
  return status === 'idle' || status === 'finished'
}

export function timerReducer(
  state: TimerState,
  action: TimerAction,
): TimerState {
  switch (action.type) {
    case 'SET_FIELD': {
      if (!isEditable(state.status)) {
        return state
      }
      const max = action.field === 'h' ? 99 : 59
      return withInputs(state, {
        ...state.inputs,
        [action.field]: clampField(action.rawValue, max),
      })
    }

    case 'SET_PRESET': {
      if (!isEditable(state.status)) {
        return state
      }
      return withInputs(state, {
        h: 0,
        m: clampField(action.minutes, 59),
        s: 0,
      })
    }

    case 'START': {
      if (state.status === 'running' || state.durationMs <= 0) {
        return state
      }
      const resuming = state.status === 'paused' && state.remainingMs > 0
      const baseRemainingMs = resuming ? state.remainingMs : state.durationMs
      return {
        ...state,
        status: 'running',
        remainingMs: baseRemainingMs,
        endAt: action.now + baseRemainingMs,
        runId: resuming ? state.runId : state.runId + 1,
      }
    }

    case 'PAUSE': {
      if (state.status !== 'running' || state.endAt === null) {
        return state
      }
      const nextRemaining = Math.max(0, state.endAt - action.now)
      if (nextRemaining <= 0) {
        return {
          ...state,
          status: 'finished',
          remainingMs: 0,
          endAt: null,
        }
      }
      return {
        ...state,
        status: 'paused',
        remainingMs: nextRemaining,
        endAt: null,
      }
    }

    case 'RESET': {
      return {
        ...state,
        status: 'idle',
        remainingMs: state.durationMs,
        endAt: null,
      }
    }

    case 'FINISH': {
      if (state.status !== 'running') {
        return state
      }
      return {
        ...state,
        status: 'finished',
        remainingMs: 0,
        endAt: null,
      }
    }
  }
}

export interface UseTimerResult {
  status: ClockStatus
  inputs: TimeParts
  durationMs: number
  remainingMs: number
  formattedTime: string
  progressFraction: number
  isZeroDuration: boolean
  canStart: boolean
  canReset: boolean
  canEdit: boolean
  muted: boolean
  notifyPermission: NotifyPermission
  notifyEnabled: boolean
  setField: (field: keyof TimeParts, rawValue: string | number) => void
  setPreset: (minutes: number) => void
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  toggleMute: () => void
  toggleNotify: () => void
}

export function useTimer(): UseTimerResult {
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    createInitialTimerState,
  )
  const [muted, setMuted] = useState<boolean>(() => loadMuted())
  const [notifyPermission, setNotifyPermission] = useState<NotifyPermission>(
    () => getNotificationPermission(),
  )
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(
    () => loadNotify() && getNotificationPermission() === 'granted',
  )

  const isRunning = state.status === 'running'
  const now = useNow(isRunning)

  // Last run that already played its beep; survives StrictMode effect re-runs.
  // A timer that finished while the page was closed must not beep on load.
  const beepedRunIdRef = useRef<number>(
    state.status === 'finished' ? state.runId : 0,
  )

  // State only changes on user actions and on finish (remaining time is
  // derived), so this does not run once per frame.
  useEffect(() => {
    saveTimerSnapshot(toTimerSnapshot(state, performance.now(), Date.now()))
  }, [state])

  useEffect(() => {
    saveTimerDuration(state.inputs)
  }, [state.inputs])

  useEffect(() => {
    saveMuted(muted)
  }, [muted])

  useEffect(() => {
    saveNotify(notifyEnabled)
  }, [notifyEnabled])

  useEffect(() => {
    return () => {
      closeAudioContext()
    }
  }, [])

  useEffect(() => {
    if (
      state.status === 'running' &&
      state.endAt !== null &&
      now >= state.endAt
    ) {
      dispatch({ type: 'FINISH' })
    }
  }, [state.status, state.endAt, now])

  useEffect(() => {
    if (state.status === 'finished' && beepedRunIdRef.current !== state.runId) {
      beepedRunIdRef.current = state.runId
      if (!muted) {
        playTimerBeep()
        vibrateOnFinish()
      }
      // A page that is on screen already shows the alert; only notify when
      // the user is in another tab or window.
      if (notifyEnabled && document.hidden) {
        void showTimerNotification(formatTimer(state.durationMs))
      }
    }
  }, [state.status, state.runId, state.durationMs, muted, notifyEnabled])

  const remainingMs =
    isRunning && state.endAt !== null
      ? Math.min(state.durationMs, Math.max(0, state.endAt - now))
      : state.remainingMs

  const formattedTime = formatTimer(remainingMs)
  const progressFraction =
    state.durationMs > 0
      ? Math.min(1, Math.max(0, remainingMs / state.durationMs))
      : 0
  const isZeroDuration = state.durationMs <= 0
  const canStart = !isZeroDuration
  const canReset = state.status !== 'idle'
  const canEdit = isEditable(state.status)

  const setField = useCallback(
    (field: keyof TimeParts, rawValue: string | number) => {
      dispatch({ type: 'SET_FIELD', field, rawValue })
    },
    [],
  )

  const setPreset = useCallback((minutes: number) => {
    dispatch({ type: 'SET_PRESET', minutes })
  }, [])

  const start = useCallback(() => {
    if (state.durationMs <= 0) {
      return
    }
    unlockAudioContext()
    dispatch({ type: 'START', now: performance.now() })
  }, [state.durationMs])

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE', now: performance.now() })
  }, [])

  const toggle = useCallback(() => {
    if (isRunning) {
      dispatch({ type: 'PAUSE', now: performance.now() })
    } else if (state.durationMs > 0) {
      unlockAudioContext()
      dispatch({ type: 'START', now: performance.now() })
    }
  }, [isRunning, state.durationMs])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev)
  }, [])

  const toggleNotify = useCallback(() => {
    if (notifyEnabled) {
      setNotifyEnabled(false)
      return
    }
    void requestNotificationPermission().then((permission) => {
      setNotifyPermission(permission)
      setNotifyEnabled(permission === 'granted')
    })
  }, [notifyEnabled])

  return {
    status: state.status,
    inputs: state.inputs,
    durationMs: state.durationMs,
    remainingMs,
    formattedTime,
    progressFraction,
    isZeroDuration,
    canStart,
    canReset,
    canEdit,
    muted,
    notifyPermission,
    notifyEnabled,
    setField,
    setPreset,
    start,
    pause,
    toggle,
    reset,
    toggleMute,
    toggleNotify,
  }
}

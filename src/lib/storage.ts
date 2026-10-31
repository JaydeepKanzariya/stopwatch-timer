import type { TimeParts } from '../types.ts'
import {
  parseStopwatchSnapshot,
  parseTimerSnapshot,
  type StopwatchSnapshot,
  type TimerSnapshot,
} from './persist.ts'
import { clampField } from './time.ts'

const DURATION_KEY = 'stopwatch-timer:timer-duration-v1'
const MUTE_KEY = 'stopwatch-timer:timer-muted-v1'

export const DEFAULT_TIMER_PARTS: TimeParts = { h: 0, m: 5, s: 0 }

export function loadTimerDuration(): TimeParts {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_TIMER_PARTS
    }
    const raw = window.localStorage.getItem(DURATION_KEY)
    if (!raw) {
      return DEFAULT_TIMER_PARTS
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_TIMER_PARTS
    }

    const record = parsed as Record<string, unknown>
    if (
      typeof record.h !== 'number' ||
      typeof record.m !== 'number' ||
      typeof record.s !== 'number'
    ) {
      return DEFAULT_TIMER_PARTS
    }

    return {
      h: clampField(record.h, 99),
      m: clampField(record.m, 59),
      s: clampField(record.s, 59),
    }
  } catch {
    return DEFAULT_TIMER_PARTS
  }
}

export function saveTimerDuration(parts: TimeParts): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    const sanitised: TimeParts = {
      h: clampField(parts.h, 99),
      m: clampField(parts.m, 59),
      s: clampField(parts.s, 59),
    }
    window.localStorage.setItem(DURATION_KEY, JSON.stringify(sanitised))
  } catch {
    // Ignore localStorage failures (private mode / quota / blocked)
  }
}

export function loadMuted(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    const raw = window.localStorage.getItem(MUTE_KEY)
    if (raw === null) {
      return false
    }
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'boolean' ? parsed : false
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    window.localStorage.setItem(MUTE_KEY, JSON.stringify(muted))
  } catch {
    // Ignore localStorage failures
  }
}

const STOPWATCH_KEY = 'stopwatch-timer:stopwatch-v1'
const TIMER_STATE_KEY = 'stopwatch-timer:timer-state-v1'

function readJson(key: string): unknown {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

/** Writes `value`, or removes the key when `value` is null. */
function writeJson(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    if (value === null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  } catch {
    // Ignore localStorage failures
  }
}

export function loadStopwatchSnapshot(): StopwatchSnapshot | null {
  return parseStopwatchSnapshot(readJson(STOPWATCH_KEY))
}

export function saveStopwatchSnapshot(
  snapshot: StopwatchSnapshot | null,
): void {
  writeJson(STOPWATCH_KEY, snapshot)
}

export function loadTimerSnapshot(): TimerSnapshot | null {
  return parseTimerSnapshot(readJson(TIMER_STATE_KEY))
}

export function saveTimerSnapshot(snapshot: TimerSnapshot | null): void {
  writeJson(TIMER_STATE_KEY, snapshot)
}

const NOTIFY_KEY = 'stopwatch-timer:timer-notify-v1'

export function loadNotify(): boolean {
  return readJson(NOTIFY_KEY) === true
}

export function saveNotify(enabled: boolean): void {
  writeJson(NOTIFY_KEY, enabled)
}

/** Removes everything this app has saved. Used as a last-resort recovery. */
export function clearSavedData(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith('stopwatch-timer:')) {
        keys.push(key)
      }
    }
    keys.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore localStorage failures
  }
}

import type { TimeParts } from '../types.ts'
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

import type { TimeParts } from '../types.ts'

function pad2(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, '0')
}

/**
 * Formats stopwatch elapsed milliseconds:
 * - Under 1 hour: MM:SS.cc
 * - 1 hour and above: HH:MM:SS.cc
 */
export function formatStopwatch(ms: number): string {
  const safeMs = Math.max(0, ms)
  const totalCentiseconds = Math.floor(safeMs / 10)
  const cc = totalCentiseconds % 100
  const totalSeconds = Math.floor(totalCentiseconds / 100)
  const s = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const m = totalMinutes % 60
  const h = Math.floor(totalMinutes / 60)

  if (h > 0) {
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad2(cc)}`
  }
  return `${pad2(m)}:${pad2(s)}.${pad2(cc)}`
}

/**
 * Formats timer remaining milliseconds as HH:MM:SS.
 * Rounds up to the next whole second so it shows 00:00:01 until it truly hits 0.
 */
export function formatTimer(ms: number): string {
  const safeMs = Math.max(0, ms)
  const totalSeconds = safeMs > 0 ? Math.ceil(safeMs / 1000) : 0
  const s = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const m = totalMinutes % 60
  const h = Math.floor(totalMinutes / 60)

  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/**
 * Formats compact whole-second time for document.title (MM:SS or HH:MM:SS).
 */
export function formatCompactSeconds(wholeSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(wholeSeconds))
  const s = safeSeconds % 60
  const totalMinutes = Math.floor(safeSeconds / 60)
  const m = totalMinutes % 60
  const h = Math.floor(totalMinutes / 60)

  if (h > 0) {
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
  }
  return `${pad2(m)}:${pad2(s)}`
}

/**
 * Converts { h, m, s } into milliseconds.
 */
export function toMs(parts: TimeParts): number {
  const h = clampField(parts.h, 99)
  const m = clampField(parts.m, 59)
  const s = clampField(parts.s, 59)
  return (h * 3600 + m * 60 + s) * 1000
}

/**
 * Converts milliseconds into { h, m, s } (rounding up to whole seconds).
 */
export function fromMs(ms: number): TimeParts {
  const safeMs = Math.max(0, ms)
  const totalSeconds = safeMs > 0 ? Math.ceil(safeMs / 1000) : 0
  const s = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const m = totalMinutes % 60
  const h = Math.min(99, Math.floor(totalMinutes / 60))

  return { h, m, s }
}

/**
 * Sanitises and clamps a typed or pasted timer input value:
 * - No negatives (returns 0)
 * - No decimals (takes integer part before decimal point)
 * - No letters (strips non-digits)
 * - Empty counts as 0
 * - Clamps to [0, max]
 */
export function clampField(raw: string | number, max: number): number {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) {
      return 0
    }
    return Math.min(max, Math.floor(raw))
  }

  const trimmed = raw.trim()
  if (trimmed === '' || trimmed.startsWith('-')) {
    return 0
  }

  const integerSegment = trimmed.split('.')[0] ?? ''
  const digitsOnly = integerSegment.replace(/\D+/g, '')
  if (digitsOnly === '') {
    return 0
  }

  const parsed = Number.parseInt(digitsOnly, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }

  return Math.min(max, parsed)
}

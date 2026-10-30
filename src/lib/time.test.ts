import { describe, expect, it } from 'vitest'
import {
  clampField,
  formatCompactSeconds,
  formatStopwatch,
  formatTimer,
  fromMs,
  toMs,
} from './time.ts'

describe('formatStopwatch', () => {
  it('shows MM:SS.cc under one hour', () => {
    expect(formatStopwatch(0)).toBe('00:00.00')
    expect(formatStopwatch(1_230)).toBe('00:01.23')
    expect(formatStopwatch(59_990)).toBe('00:59.99')
    expect(formatStopwatch(61_500)).toBe('01:01.50')
  })

  it('switches to HH:MM:SS.cc from one hour', () => {
    expect(formatStopwatch(3_599_990)).toBe('59:59.99')
    expect(formatStopwatch(3_600_000)).toBe('01:00:00.00')
    expect(formatStopwatch(3_661_230)).toBe('01:01:01.23')
  })

  it('treats negative input as zero', () => {
    expect(formatStopwatch(-500)).toBe('00:00.00')
  })
})

describe('formatTimer', () => {
  it('rounds up so 00:00:01 shows until the timer truly ends', () => {
    expect(formatTimer(1)).toBe('00:00:01')
    expect(formatTimer(999)).toBe('00:00:01')
    expect(formatTimer(1_000)).toBe('00:00:01')
    expect(formatTimer(1_001)).toBe('00:00:02')
    expect(formatTimer(0)).toBe('00:00:00')
  })

  it('formats the maximum 99:59:59', () => {
    expect(formatTimer(359_999_000)).toBe('99:59:59')
  })

  it('treats negative input as zero', () => {
    expect(formatTimer(-1_000)).toBe('00:00:00')
  })
})

describe('formatCompactSeconds', () => {
  it('uses MM:SS under one hour and HH:MM:SS from one hour', () => {
    expect(formatCompactSeconds(272)).toBe('04:32')
    expect(formatCompactSeconds(3_599)).toBe('59:59')
    expect(formatCompactSeconds(3_600)).toBe('01:00:00')
  })
})

describe('toMs and fromMs', () => {
  it('converts parts to milliseconds', () => {
    expect(toMs({ h: 0, m: 0, s: 0 })).toBe(0)
    expect(toMs({ h: 0, m: 5, s: 0 })).toBe(300_000)
    expect(toMs({ h: 99, m: 59, s: 59 })).toBe(359_999_000)
  })

  it('clamps out-of-range parts instead of overflowing', () => {
    expect(toMs({ h: 150, m: 99, s: 99 })).toBe(359_999_000)
  })

  it('round-trips whole seconds', () => {
    expect(fromMs(toMs({ h: 1, m: 2, s: 3 }))).toEqual({ h: 1, m: 2, s: 3 })
  })

  it('rounds partial seconds up', () => {
    expect(fromMs(1_500)).toEqual({ h: 0, m: 0, s: 2 })
  })
})

describe('clampField', () => {
  it('treats empty and whitespace as 0', () => {
    expect(clampField('', 59)).toBe(0)
    expect(clampField('   ', 59)).toBe(0)
  })

  it('rejects negatives', () => {
    expect(clampField('-5', 59)).toBe(0)
    expect(clampField(-5, 59)).toBe(0)
  })

  it('truncates decimals', () => {
    expect(clampField('1.5', 59)).toBe(1)
    expect(clampField(1.9, 59)).toBe(1)
  })

  it('strips letters', () => {
    expect(clampField('abc', 59)).toBe(0)
    expect(clampField('1a2', 59)).toBe(12)
  })

  it('clamps to the field maximum', () => {
    expect(clampField('999', 99)).toBe(99)
    expect(clampField('75', 59)).toBe(59)
    expect(clampField(Number.POSITIVE_INFINITY, 59)).toBe(0)
  })

  it('accepts valid values and drops leading zeros', () => {
    expect(clampField('07', 59)).toBe(7)
    expect(clampField('59', 59)).toBe(59)
  })
})

import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_TIMER_PARTS,
  clearSavedData,
  loadMuted,
  loadNotify,
  loadStopwatchSnapshot,
  loadTimerDuration,
  loadTimerSnapshot,
  saveMuted,
  saveNotify,
  saveStopwatchSnapshot,
  saveTimerDuration,
  saveTimerSnapshot,
} from './storage.ts'

describe('timer duration', () => {
  it('defaults when nothing is saved', () => {
    expect(loadTimerDuration()).toEqual(DEFAULT_TIMER_PARTS)
  })

  it('round-trips a saved duration', () => {
    saveTimerDuration({ h: 1, m: 2, s: 3 })
    expect(loadTimerDuration()).toEqual({ h: 1, m: 2, s: 3 })
  })

  it('clamps out-of-range values it reads back', () => {
    window.localStorage.setItem(
      'stopwatch-timer:timer-duration-v1',
      JSON.stringify({ h: 500, m: 99, s: -4 }),
    )
    expect(loadTimerDuration()).toEqual({ h: 99, m: 59, s: 0 })
  })

  it.each(['{broken', '"text"', '[1,2,3]', '{"h":1}', 'null'])(
    'falls back to the default for corrupt data %s',
    (raw) => {
      window.localStorage.setItem('stopwatch-timer:timer-duration-v1', raw)
      expect(loadTimerDuration()).toEqual(DEFAULT_TIMER_PARTS)
    },
  )
})

describe('boolean preferences', () => {
  it('defaults to false and round-trips', () => {
    expect(loadMuted()).toBe(false)
    expect(loadNotify()).toBe(false)
    saveMuted(true)
    saveNotify(true)
    expect(loadMuted()).toBe(true)
    expect(loadNotify()).toBe(true)
  })

  it('ignores a non-boolean saved value', () => {
    window.localStorage.setItem('stopwatch-timer:timer-muted-v1', '"yes"')
    expect(loadMuted()).toBe(false)
  })
})

describe('clock snapshots', () => {
  it('round-trips and removes a snapshot when saving null', () => {
    saveStopwatchSnapshot({
      status: 'paused',
      accumulatedMs: 100,
      startedAtWall: null,
      laps: [],
    })
    expect(loadStopwatchSnapshot()).toMatchObject({ accumulatedMs: 100 })
    saveStopwatchSnapshot(null)
    expect(loadStopwatchSnapshot()).toBeNull()

    saveTimerSnapshot({
      status: 'paused',
      remainingMs: 5,
      endAtWall: null,
      runId: 1,
    })
    expect(loadTimerSnapshot()).toMatchObject({ remainingMs: 5 })
    saveTimerSnapshot(null)
    expect(loadTimerSnapshot()).toBeNull()
  })

  it('treats corrupt snapshots as missing', () => {
    window.localStorage.setItem('stopwatch-timer:stopwatch-v1', '{nope')
    window.localStorage.setItem('stopwatch-timer:timer-state-v1', '{"a":1}')
    expect(loadStopwatchSnapshot()).toBeNull()
    expect(loadTimerSnapshot()).toBeNull()
  })
})

describe('clearSavedData', () => {
  it("removes only this app's keys", () => {
    saveMuted(true)
    saveTimerDuration({ h: 0, m: 1, s: 0 })
    window.localStorage.setItem('other-app:setting', 'keep me')
    clearSavedData()
    expect(loadMuted()).toBe(false)
    expect(loadTimerDuration()).toEqual(DEFAULT_TIMER_PARTS)
    expect(window.localStorage.getItem('other-app:setting')).toBe('keep me')
  })
})

describe('when localStorage is unavailable', () => {
  it('reads defaults and never throws on write', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadTimerDuration()).toEqual(DEFAULT_TIMER_PARTS)
    expect(loadMuted()).toBe(false)
    expect(loadNotify()).toBe(false)
    expect(loadStopwatchSnapshot()).toBeNull()
    expect(() => saveMuted(true)).not.toThrow()
    expect(() => saveTimerDuration({ h: 1, m: 1, s: 1 })).not.toThrow()
    expect(() => clearSavedData()).not.toThrow()
  })
})

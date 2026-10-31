import { describe, expect, it } from 'vitest'
import type { StopwatchState, TimerState } from '../types.ts'
import {
  fromStopwatchSnapshot,
  fromTimerSnapshot,
  parseStopwatchSnapshot,
  parseTimerSnapshot,
  toStopwatchSnapshot,
  toTimerSnapshot,
} from './persist.ts'

function must<T>(value: T | null): T {
  if (value === null) {
    throw new Error('expected a value')
  }
  return value
}

const BASE_TIMER: TimerState = {
  status: 'idle',
  inputs: { h: 0, m: 0, s: 10 },
  durationMs: 10_000,
  remainingMs: 10_000,
  endAt: null,
  runId: 0,
}

describe('stopwatch snapshots', () => {
  it('does not save an idle stopwatch', () => {
    const idle: StopwatchState = {
      status: 'idle',
      accumulatedMs: 0,
      startedAt: null,
      laps: [],
    }
    expect(toStopwatchSnapshot(idle, 500, 1_000_000)).toBeNull()
  })

  it('keeps counting while the page was closed', () => {
    // Started 2 s ago (perf clock), with 1 s already accumulated.
    const running: StopwatchState = {
      status: 'running',
      accumulatedMs: 1_000,
      startedAt: 8_000,
      laps: [],
    }
    const snapshot = toStopwatchSnapshot(running, 10_000, 1_700_000_010_000)
    expect(snapshot?.startedAtWall).toBe(1_700_000_008_000)

    // Reload 30 s later: new page, perf clock restarted at 50 ms.
    const restored = fromStopwatchSnapshot(
      must(snapshot),
      50,
      1_700_000_040_000,
    )
    expect(restored.status).toBe('running')
    // elapsed = accumulated + (perfNow - startedAt) = 1000 + 32000
    expect(restored.accumulatedMs + (50 - (restored.startedAt ?? 0))).toBe(
      33_000,
    )
  })

  it('restores a paused stopwatch exactly, with its laps', () => {
    const paused: StopwatchState = {
      status: 'paused',
      accumulatedMs: 4_200,
      startedAt: null,
      laps: [{ id: 1, lapNumber: 1, splitMs: 4_200, totalMs: 4_200 }],
    }
    const snapshot = toStopwatchSnapshot(paused, 1, 2)
    expect(snapshot).not.toBeNull()
    expect(fromStopwatchSnapshot(must(snapshot), 99, 999)).toEqual(paused)
  })

  it('treats a system clock that moved backwards as zero time away', () => {
    const restored = fromStopwatchSnapshot(
      { status: 'running', accumulatedMs: 0, startedAtWall: 5_000, laps: [] },
      100,
      1_000,
    )
    expect(restored.startedAt).toBe(100)
  })
})

describe('timer snapshots', () => {
  it('does not save an idle timer', () => {
    expect(toTimerSnapshot(BASE_TIMER, 0, 0)).toBeNull()
  })

  it('keeps counting down while the page was closed', () => {
    const running: TimerState = {
      ...BASE_TIMER,
      status: 'running',
      endAt: 14_000,
      runId: 3,
    }
    // 4 s left now (perf 10_000), wall clock 1_000_000.
    const snapshot = toTimerSnapshot(running, 10_000, 1_000_000)
    expect(snapshot?.endAtWall).toBe(1_004_000)

    // Reload 1 s later: 3 s remain.
    const restored = fromTimerSnapshot(
      must(snapshot),
      BASE_TIMER,
      20,
      1_001_000,
    )
    expect(restored.status).toBe('running')
    expect(restored.runId).toBe(3)
    expect(restored.endAt).toBe(20 + 3_000)
  })

  it('shows finished when it ran out while the page was closed', () => {
    const restored = fromTimerSnapshot(
      { status: 'running', remainingMs: 1_000, endAtWall: 5_000, runId: 2 },
      BASE_TIMER,
      0,
      9_000,
    )
    expect(restored).toMatchObject({
      status: 'finished',
      remainingMs: 0,
      endAt: null,
      runId: 2,
    })
  })

  it('restores a paused timer with its remaining time', () => {
    const restored = fromTimerSnapshot(
      { status: 'paused', remainingMs: 6_500, endAtWall: null, runId: 1 },
      BASE_TIMER,
      0,
      0,
    )
    expect(restored).toMatchObject({ status: 'paused', remainingMs: 6_500 })
  })

  it('clamps a remaining time that exceeds the saved duration', () => {
    const restored = fromTimerSnapshot(
      { status: 'paused', remainingMs: 99_000, endAtWall: null, runId: 1 },
      BASE_TIMER,
      0,
      0,
    )
    expect(restored.remainingMs).toBe(10_000)
  })

  it('ignores a snapshot when the saved duration is zero', () => {
    const zero: TimerState = { ...BASE_TIMER, durationMs: 0, remainingMs: 0 }
    const restored = fromTimerSnapshot(
      { status: 'paused', remainingMs: 5_000, endAtWall: null, runId: 1 },
      zero,
      0,
      0,
    )
    expect(restored).toBe(zero)
  })
})

describe('snapshot validation', () => {
  it('accepts well-formed stopwatch data', () => {
    expect(
      parseStopwatchSnapshot({
        status: 'running',
        accumulatedMs: 10,
        startedAtWall: 1_000,
        laps: [{ id: 1, lapNumber: 1, splitMs: 5, totalMs: 5 }],
      }),
    ).not.toBeNull()
  })

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'running'],
    ['an unknown status', { status: 'idle', accumulatedMs: 0, laps: [] }],
    [
      'running without a start time',
      { status: 'running', accumulatedMs: 0, laps: [] },
    ],
    [
      'a negative accumulated time',
      { status: 'paused', accumulatedMs: -5, laps: [] },
    ],
    [
      'a NaN accumulated time',
      { status: 'paused', accumulatedMs: Number.NaN, laps: [] },
    ],
    [
      'a malformed lap',
      { status: 'paused', accumulatedMs: 0, laps: [{ id: 1 }] },
    ],
    [
      'laps that are not an array',
      { status: 'paused', accumulatedMs: 0, laps: 5 },
    ],
  ])('rejects stopwatch data with %s', (_label, value) => {
    expect(parseStopwatchSnapshot(value)).toBeNull()
  })

  it('accepts well-formed timer data', () => {
    expect(
      parseTimerSnapshot({
        status: 'running',
        remainingMs: 5,
        endAtWall: 99,
        runId: 1,
      }),
    ).toEqual({ status: 'running', remainingMs: 5, endAtWall: 99, runId: 1 })
  })

  it.each([
    ['null', null],
    ['an unknown status', { status: 'idle', remainingMs: 0, runId: 0 }],
    [
      'running without an end time',
      { status: 'running', remainingMs: 5, runId: 1 },
    ],
    ['a missing run id', { status: 'paused', remainingMs: 5 }],
    [
      'a negative remaining time',
      { status: 'paused', remainingMs: -1, runId: 1 },
    ],
  ])('rejects timer data with %s', (_label, value) => {
    expect(parseTimerSnapshot(value)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { stopwatchReducer, type StopwatchState } from './useStopwatch.ts'
import { timerReducer, type TimerState } from './useTimer.ts'

const IDLE_STOPWATCH: StopwatchState = {
  status: 'idle',
  accumulatedMs: 0,
  startedAt: null,
  laps: [],
}

const IDLE_TIMER: TimerState = {
  status: 'idle',
  inputs: { h: 0, m: 0, s: 10 },
  durationMs: 10_000,
  remainingMs: 10_000,
  endAt: null,
  runId: 0,
}

describe('stopwatchReducer', () => {
  it('accumulates time across pause and resume without drift', () => {
    let state = stopwatchReducer(IDLE_STOPWATCH, { type: 'START', now: 1_000 })
    state = stopwatchReducer(state, { type: 'PAUSE', now: 1_500 })
    expect(state.status).toBe('paused')
    expect(state.accumulatedMs).toBe(500)

    state = stopwatchReducer(state, { type: 'START', now: 9_000 })
    state = stopwatchReducer(state, { type: 'PAUSE', now: 9_250 })
    expect(state.accumulatedMs).toBe(750)
  })

  it('ignores a second START while running', () => {
    const running = stopwatchReducer(IDLE_STOPWATCH, { type: 'START', now: 100 })
    expect(stopwatchReducer(running, { type: 'START', now: 900 })).toBe(running)
  })

  it('records laps newest first with split and total', () => {
    let state = stopwatchReducer(IDLE_STOPWATCH, { type: 'START', now: 0 })
    state = stopwatchReducer(state, { type: 'LAP', now: 1_000 })
    state = stopwatchReducer(state, { type: 'LAP', now: 2_500 })
    expect(state.laps.map((l) => l.lapNumber)).toEqual([2, 1])
    expect(state.laps[0]).toMatchObject({ splitMs: 1_500, totalMs: 2_500 })
    expect(state.laps[1]).toMatchObject({ splitMs: 1_000, totalMs: 1_000 })
  })

  it('only records laps while running and clears everything on reset', () => {
    expect(stopwatchReducer(IDLE_STOPWATCH, { type: 'LAP', now: 500 })).toBe(
      IDLE_STOPWATCH,
    )
    let state = stopwatchReducer(IDLE_STOPWATCH, { type: 'START', now: 0 })
    state = stopwatchReducer(state, { type: 'LAP', now: 400 })
    expect(stopwatchReducer(state, { type: 'RESET' })).toEqual(IDLE_STOPWATCH)
  })
})

describe('timerReducer', () => {
  it('sets endAt from the start time and duration', () => {
    const state = timerReducer(IDLE_TIMER, { type: 'START', now: 5_000 })
    expect(state.status).toBe('running')
    expect(state.endAt).toBe(15_000)
    expect(state.runId).toBe(1)
  })

  it('cannot start with a zero duration', () => {
    const zero: TimerState = { ...IDLE_TIMER, durationMs: 0, remainingMs: 0 }
    expect(timerReducer(zero, { type: 'START', now: 0 })).toBe(zero)
  })

  it('pauses with the exact remaining time and resumes from it', () => {
    let state = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    state = timerReducer(state, { type: 'PAUSE', now: 4_000 })
    expect(state.status).toBe('paused')
    expect(state.remainingMs).toBe(6_000)

    state = timerReducer(state, { type: 'START', now: 20_000 })
    expect(state.endAt).toBe(26_000)
    expect(state.runId).toBe(1)
  })

  it('finishes when paused at or after the end time', () => {
    const running = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    const state = timerReducer(running, { type: 'PAUSE', now: 10_000 })
    expect(state.status).toBe('finished')
    expect(state.remainingMs).toBe(0)
  })

  it('FINISH only applies to a running timer', () => {
    expect(timerReducer(IDLE_TIMER, { type: 'FINISH' })).toBe(IDLE_TIMER)
    const running = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    expect(timerReducer(running, { type: 'FINISH' }).status).toBe('finished')
  })

  it('locks the inputs while running or paused', () => {
    const running = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    expect(
      timerReducer(running, { type: 'SET_FIELD', field: 'm', rawValue: '5' }),
    ).toBe(running)
    expect(timerReducer(running, { type: 'SET_PRESET', minutes: 5 })).toBe(running)
  })

  it('sanitises and clamps typed values', () => {
    const state = timerReducer(IDLE_TIMER, {
      type: 'SET_FIELD',
      field: 'm',
      rawValue: '999',
    })
    expect(state.inputs.m).toBe(59)
    expect(state.durationMs).toBe(59 * 60_000 + 10_000)
  })

  it('applies a preset', () => {
    const state = timerReducer(IDLE_TIMER, { type: 'SET_PRESET', minutes: 25 })
    expect(state.inputs).toEqual({ h: 0, m: 25, s: 0 })
    expect(state.durationMs).toBe(1_500_000)
  })

  it('lets you edit after finishing and returns to idle', () => {
    let state = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    state = timerReducer(state, { type: 'FINISH' })
    state = timerReducer(state, { type: 'SET_PRESET', minutes: 5 })
    expect(state.status).toBe('idle')
    expect(state.remainingMs).toBe(300_000)
  })

  it('reset returns to the entered duration', () => {
    let state = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    state = timerReducer(state, { type: 'PAUSE', now: 3_000 })
    state = timerReducer(state, { type: 'RESET' })
    expect(state.status).toBe('idle')
    expect(state.remainingMs).toBe(10_000)
    expect(state.endAt).toBeNull()
  })

  it('gives every fresh run a new runId so the beep fires once per run', () => {
    let state = timerReducer(IDLE_TIMER, { type: 'START', now: 0 })
    state = timerReducer(state, { type: 'FINISH' })
    state = timerReducer(state, { type: 'RESET' })
    state = timerReducer(state, { type: 'START', now: 50_000 })
    expect(state.runId).toBe(2)
  })
})

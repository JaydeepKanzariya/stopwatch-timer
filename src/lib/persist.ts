import type { Lap, StopwatchState, TimerState } from '../types.ts'

/**
 * Snapshots let a running or paused clock survive a page reload.
 *
 * In memory the clocks use `performance.now()`, which restarts from zero on
 * every page load. A snapshot therefore stores wall-clock (`Date.now()`)
 * anchors instead, and the conversions below translate between the two. They
 * are pure: callers pass both clocks in.
 */

export interface StopwatchSnapshot {
  status: 'running' | 'paused'
  accumulatedMs: number
  /** Wall-clock time the current run started. Null while paused. */
  startedAtWall: number | null
  laps: Lap[]
}

export interface TimerSnapshot {
  status: 'running' | 'paused' | 'finished'
  remainingMs: number
  /** Wall-clock time the countdown ends. Only set while running. */
  endAtWall: number | null
  runId: number
}

const MAX_LAPS = 10_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function parseLap(value: unknown): Lap | null {
  if (!isRecord(value)) {
    return null
  }
  const { id, lapNumber, splitMs, totalMs } = value
  if (
    !isNonNegative(id) ||
    !isNonNegative(lapNumber) ||
    !isNonNegative(splitMs) ||
    !isNonNegative(totalMs)
  ) {
    return null
  }
  return { id, lapNumber, splitMs, totalMs }
}

export function parseStopwatchSnapshot(
  value: unknown,
): StopwatchSnapshot | null {
  if (!isRecord(value)) {
    return null
  }
  const { status, accumulatedMs, startedAtWall, laps } = value
  if (status !== 'running' && status !== 'paused') {
    return null
  }
  if (!isNonNegative(accumulatedMs) || !Array.isArray(laps)) {
    return null
  }
  if (laps.length > MAX_LAPS) {
    return null
  }

  const parsedLaps: Lap[] = []
  for (const raw of laps) {
    const lap = parseLap(raw)
    if (!lap) {
      return null
    }
    parsedLaps.push(lap)
  }

  if (status === 'running') {
    if (!isNonNegative(startedAtWall)) {
      return null
    }
    return { status, accumulatedMs, startedAtWall, laps: parsedLaps }
  }
  return { status, accumulatedMs, startedAtWall: null, laps: parsedLaps }
}

export function parseTimerSnapshot(value: unknown): TimerSnapshot | null {
  if (!isRecord(value)) {
    return null
  }
  const { status, remainingMs, endAtWall, runId } = value
  if (status !== 'running' && status !== 'paused' && status !== 'finished') {
    return null
  }
  if (!isNonNegative(remainingMs) || !isNonNegative(runId)) {
    return null
  }
  if (status === 'running') {
    if (!isNonNegative(endAtWall)) {
      return null
    }
    return { status, remainingMs, endAtWall, runId }
  }
  return { status, remainingMs, endAtWall: null, runId }
}

export function toStopwatchSnapshot(
  state: StopwatchState,
  perfNow: number,
  wallNow: number,
): StopwatchSnapshot | null {
  if (state.status === 'idle') {
    return null
  }
  const startedAtWall =
    state.status === 'running' && state.startedAt !== null
      ? wallNow - (perfNow - state.startedAt)
      : null
  return {
    status: state.status,
    accumulatedMs: state.accumulatedMs,
    startedAtWall,
    laps: state.laps,
  }
}

export function fromStopwatchSnapshot(
  snapshot: StopwatchSnapshot,
  perfNow: number,
  wallNow: number,
): StopwatchState {
  if (snapshot.status === 'running' && snapshot.startedAtWall !== null) {
    // If the system clock moved backwards, treat the gap as zero.
    const away = Math.max(0, wallNow - snapshot.startedAtWall)
    return {
      status: 'running',
      accumulatedMs: snapshot.accumulatedMs,
      startedAt: perfNow - away,
      laps: snapshot.laps,
    }
  }
  return {
    status: 'paused',
    accumulatedMs: snapshot.accumulatedMs,
    startedAt: null,
    laps: snapshot.laps,
  }
}

export function toTimerSnapshot(
  state: TimerState,
  perfNow: number,
  wallNow: number,
): TimerSnapshot | null {
  if (state.status === 'idle') {
    return null
  }
  const endAtWall =
    state.status === 'running' && state.endAt !== null
      ? wallNow + (state.endAt - perfNow)
      : null
  return {
    status: state.status,
    remainingMs: state.remainingMs,
    endAtWall,
    runId: state.runId,
  }
}

/**
 * Applies a saved snapshot on top of `base`, the idle state built from the
 * saved duration inputs. Falls back to `base` if the snapshot does not fit
 * the current duration.
 */
export function fromTimerSnapshot(
  snapshot: TimerSnapshot,
  base: TimerState,
  perfNow: number,
  wallNow: number,
): TimerState {
  if (base.durationMs <= 0) {
    return base
  }

  if (snapshot.status === 'finished') {
    return {
      ...base,
      status: 'finished',
      remainingMs: 0,
      endAt: null,
      runId: snapshot.runId,
    }
  }

  if (snapshot.status === 'running' && snapshot.endAtWall !== null) {
    const remainingMs = snapshot.endAtWall - wallNow
    if (remainingMs <= 0) {
      // It ran out while the page was closed.
      return {
        ...base,
        status: 'finished',
        remainingMs: 0,
        endAt: null,
        runId: snapshot.runId,
      }
    }
    const clamped = Math.min(base.durationMs, remainingMs)
    return {
      ...base,
      status: 'running',
      remainingMs: clamped,
      endAt: perfNow + clamped,
      runId: snapshot.runId,
    }
  }

  if (snapshot.status === 'paused' && snapshot.remainingMs > 0) {
    return {
      ...base,
      status: 'paused',
      remainingMs: Math.min(base.durationMs, snapshot.remainingMs),
      endAt: null,
      runId: snapshot.runId,
    }
  }

  return base
}

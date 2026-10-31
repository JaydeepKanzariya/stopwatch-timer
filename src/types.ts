export type TabMode = 'stopwatch' | 'timer'

export type ClockStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface Lap {
  id: number
  lapNumber: number
  splitMs: number
  totalMs: number
}

export interface TimeParts {
  h: number
  m: number
  s: number
}

export interface LapExtremes {
  fastestId: number | null
  slowestId: number | null
}

export interface StopwatchState {
  status: Extract<ClockStatus, 'idle' | 'running' | 'paused'>
  accumulatedMs: number
  startedAt: number | null
  laps: Lap[]
}

export interface TimerState {
  status: ClockStatus
  inputs: TimeParts
  durationMs: number
  remainingMs: number
  endAt: number | null
  /** Increments on every fresh run so the finish beep fires once per run. */
  runId: number
}

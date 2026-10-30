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

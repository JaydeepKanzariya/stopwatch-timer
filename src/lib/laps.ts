import type { Lap, LapExtremes } from '../types.ts'

/**
 * Returns the fastest and slowest lap IDs once there are 3 or more laps.
 * Compares laps by their split time (`splitMs`).
 */
export function getLapExtremes(laps: readonly Lap[]): LapExtremes {
  if (laps.length < 3) {
    return { fastestId: null, slowestId: null }
  }

  let fastest = laps[0]
  let slowest = laps[0]

  for (let i = 1; i < laps.length; i += 1) {
    const current = laps[i]
    if (current.splitMs < fastest.splitMs) {
      fastest = current
    }
    if (current.splitMs > slowest.splitMs) {
      slowest = current
    }
  }

  if (fastest.id === slowest.id) {
    return { fastestId: null, slowestId: null }
  }

  return {
    fastestId: fastest.id,
    slowestId: slowest.id,
  }
}

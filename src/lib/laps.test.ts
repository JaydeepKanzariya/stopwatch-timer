import { describe, expect, it } from 'vitest'
import type { Lap } from '../types.ts'
import { getLapExtremes } from './laps.ts'

function lap(id: number, splitMs: number): Lap {
  return { id, lapNumber: id, splitMs, totalMs: splitMs * id }
}

describe('getLapExtremes', () => {
  it('returns nothing for fewer than 3 laps', () => {
    expect(getLapExtremes([])).toEqual({ fastestId: null, slowestId: null })
    expect(getLapExtremes([lap(1, 1_000), lap(2, 2_000)])).toEqual({
      fastestId: null,
      slowestId: null,
    })
  })

  it('finds the fastest and slowest split from 3 laps', () => {
    const laps = [lap(3, 2_000), lap(2, 500), lap(1, 3_000)]
    expect(getLapExtremes(laps)).toEqual({ fastestId: 2, slowestId: 1 })
  })

  it('returns nothing when every split is identical', () => {
    const laps = [lap(3, 1_000), lap(2, 1_000), lap(1, 1_000)]
    expect(getLapExtremes(laps)).toEqual({ fastestId: null, slowestId: null })
  })
})

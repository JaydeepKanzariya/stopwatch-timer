import { formatStopwatch } from '../lib/time.ts'
import type { Lap, LapExtremes } from '../types.ts'

interface LapListProps {
  laps: readonly Lap[]
  extremes: LapExtremes
}

export function LapList({ laps, extremes }: LapListProps) {
  if (laps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        No laps recorded yet. Press <span className="font-medium">Lap</span>{' '}
        while running to record split times.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-semibold tracking-wider text-slate-600 uppercase dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 sm:px-4">
        <div className="col-span-5">Lap</div>
        <div className="col-span-4 text-right">Split</div>
        <div className="col-span-3 text-right">Total</div>
      </div>

      <ul
        aria-label="Recorded laps"
        className="max-h-60 divide-y divide-slate-200/70 overflow-y-auto dark:divide-slate-800/70"
      >
        {laps.map((lap) => {
          const isFastest = lap.id === extremes.fastestId
          const isSlowest = lap.id === extremes.slowestId

          let rowStyle = 'text-slate-700 dark:text-slate-200'
          if (isFastest) {
            rowStyle =
              'bg-teal-50/80 text-teal-900 dark:bg-teal-950/35 dark:text-teal-200'
          } else if (isSlowest) {
            rowStyle =
              'bg-red-50/70 text-red-900 dark:bg-red-950/30 dark:text-red-200'
          }

          return (
            <li
              key={lap.id}
              className={`grid grid-cols-12 items-center px-3 py-2.5 text-xs sm:px-4 sm:text-sm tabular-nums ${rowStyle}`}
            >
              <div className="col-span-5 flex flex-wrap items-center gap-1.5 font-medium">
                <span>#{String(lap.lapNumber).padStart(2, '0')}</span>
                {isFastest && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-600/15 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-400/15 dark:text-teal-300">
                    <span aria-hidden="true">↑</span> Fastest
                  </span>
                )}
                {isSlowest && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-red-600/15 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-400/15 dark:text-red-300">
                    <span aria-hidden="true">↓</span> Slowest
                  </span>
                )}
              </div>

              <div className="col-span-4 text-right font-mono font-semibold">
                {formatStopwatch(lap.splitMs)}
              </div>

              <div className="col-span-3 text-right font-mono text-slate-600 dark:text-slate-400">
                {formatStopwatch(lap.totalMs)}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import type { UseStopwatchResult } from '../hooks/useStopwatch.ts'
import { Controls } from './Controls.tsx'
import { LapList } from './LapList.tsx'
import { TimeDisplay } from './TimeDisplay.tsx'

interface StopwatchProps {
  stopwatch: UseStopwatchResult
}

export function Stopwatch({ stopwatch }: StopwatchProps) {
  const {
    status,
    elapsedMs,
    formattedTime,
    laps,
    lapExtremes,
    canReset,
    canLap,
    start,
    pause,
    reset,
    lap,
  } = stopwatch

  const sublabel =
    elapsedMs >= 3_600_000 ? 'HH : MM : SS . cc' : 'MM : SS . cc'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-[168px] flex-col items-center justify-center rounded-2xl bg-slate-100/70 px-3 py-6 dark:bg-slate-800/40 sm:min-h-[196px] sm:px-6">
        <TimeDisplay value={formattedTime} sublabel={sublabel} />
      </div>

      <Controls
        status={status}
        canReset={canReset}
        onStart={start}
        onPause={pause}
        onReset={reset}
        secondaryAction={{
          label: 'Lap',
          onClick: lap,
          disabled: !canLap,
        }}
      />

      <LapList laps={laps} extremes={lapExtremes} />
    </div>
  )
}

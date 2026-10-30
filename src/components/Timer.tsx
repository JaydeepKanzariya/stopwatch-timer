import type { UseTimerResult } from '../hooks/useTimer.ts'
import { Controls } from './Controls.tsx'
import { Presets } from './Presets.tsx'
import { ProgressRing } from './ProgressRing.tsx'
import { TimeDisplay } from './TimeDisplay.tsx'
import { TimerInputs } from './TimerInputs.tsx'

interface TimerProps {
  timer: UseTimerResult
}

export function Timer({ timer }: TimerProps) {
  const {
    status,
    inputs,
    formattedTime,
    progressFraction,
    isZeroDuration,
    canStart,
    canReset,
    canEdit,
    muted,
    setField,
    setPreset,
    start,
    pause,
    reset,
    toggleMute,
  } = timer

  const isIdle = canEdit
  const isFinished = status === 'finished'
  const displayValue = isFinished ? "Time's up" : formattedTime

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {isFinished
            ? 'Countdown complete'
            : status === 'running'
              ? 'Counting down'
              : status === 'paused'
                ? 'Paused'
                : 'Configure countdown'}
        </span>

        <button
          type="button"
          aria-pressed={muted}
          onClick={toggleMute}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            muted
              ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              : 'border-teal-500/40 bg-teal-50/70 text-teal-800 hover:bg-teal-100/70 dark:border-teal-500/40 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/50'
          }`}
        >
          {muted ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
          <span>{muted ? 'Muted' : 'Sound on'}</span>
        </button>
      </div>

      <div
        className={`rounded-2xl border px-3 py-4 transition-colors sm:px-6 ${
          isFinished
            ? 'border-red-400 bg-red-50/70 dark:border-red-500/70 dark:bg-red-950/30 motion-safe:animate-[pulse_1s_ease-in-out_3] motion-reduce:animate-none'
            : 'border-transparent bg-slate-100/70 dark:bg-slate-800/40'
        }`}
      >
        <ProgressRing fraction={progressFraction} isFinished={isFinished}>
          <TimeDisplay
            value={displayValue}
            isAlert={isFinished}
            compact={true}
            sublabel={isFinished ? '00 : 00 : 00' : 'HH : MM : SS'}
          />
        </ProgressRing>
      </div>

      <Controls
        status={status}
        canStart={canStart}
        canReset={canReset}
        onStart={start}
        onPause={pause}
        onReset={reset}
      />

      <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        <Presets
          inputs={inputs}
          isIdle={isIdle}
          onSelectPreset={setPreset}
        />

        <TimerInputs
          inputs={inputs}
          isIdle={isIdle}
          isZeroDuration={isZeroDuration}
          onChangeField={setField}
        />
      </div>
    </div>
  )
}

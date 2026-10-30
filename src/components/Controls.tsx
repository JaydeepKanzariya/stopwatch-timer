import type { ClockStatus } from '../types.ts'

interface SecondaryAction {
  label: string
  onClick: () => void
  disabled: boolean
}

interface ControlsProps {
  status: ClockStatus
  canStart?: boolean
  canReset: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  secondaryAction?: SecondaryAction
}

export function Controls({
  status,
  canStart = true,
  canReset,
  onStart,
  onPause,
  onReset,
  secondaryAction,
}: ControlsProps) {
  const isRunning = status === 'running'
  const primaryLabel = isRunning
    ? 'Pause'
    : status === 'paused'
      ? 'Resume'
      : 'Start'

  const handlePrimaryClick = () => {
    if (isRunning) {
      onPause()
    } else {
      onStart()
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
      <button
        type="button"
        onClick={handlePrimaryClick}
        disabled={!isRunning && !canStart}
        className="min-h-[44px] min-w-[112px] flex-1 sm:flex-initial sm:min-w-[136px] rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-teal-800 enabled:active:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:bg-teal-500 dark:text-slate-950 dark:enabled:hover:bg-teal-400 dark:focus-visible:ring-offset-slate-900"
      >
        {primaryLabel}
      </button>

      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          className="min-h-[44px] min-w-[92px] flex-1 sm:flex-initial sm:min-w-[112px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-teal-500/60 enabled:hover:bg-teal-50/60 enabled:hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:enabled:hover:border-teal-400/60 dark:enabled:hover:bg-teal-950/40 dark:enabled:hover:text-teal-300 dark:focus-visible:ring-offset-slate-900"
        >
          {secondaryAction.label}
        </button>
      )}

      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        className="min-h-[44px] min-w-[92px] flex-1 sm:flex-initial sm:min-w-[112px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-red-300 enabled:hover:bg-red-50 enabled:hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:enabled:hover:border-red-800/80 dark:enabled:hover:bg-red-950/50 dark:enabled:hover:text-red-300 dark:focus-visible:ring-offset-slate-900"
      >
        Reset
      </button>
    </div>
  )
}

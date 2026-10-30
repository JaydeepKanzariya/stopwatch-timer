import type { TimeParts } from '../types.ts'

interface PresetsProps {
  inputs: TimeParts
  isIdle: boolean
  onSelectPreset: (minutes: number) => void
}

const PRESET_MINUTES: readonly number[] = [1, 5, 10, 25]

export function Presets({ inputs, isIdle, onSelectPreset }: PresetsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PRESET_MINUTES.map((minutes) => {
        const isSelected =
          inputs.h === 0 && inputs.m === minutes && inputs.s === 0

        return (
          <button
            key={minutes}
            type="button"
            disabled={!isIdle}
            onClick={() => onSelectPreset(minutes)}
            className={`min-h-[44px] rounded-xl border px-2 py-2 text-xs font-semibold transition-colors sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:focus-visible:ring-offset-slate-900 ${
              isSelected
                ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400 dark:bg-teal-950/60 dark:text-teal-200'
                : 'border-slate-200 bg-slate-50 text-slate-700 enabled:hover:border-teal-400 enabled:hover:bg-teal-50/50 enabled:hover:text-teal-800 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:enabled:hover:border-teal-500/60 dark:enabled:hover:bg-teal-950/40 dark:enabled:hover:text-teal-300'
            }`}
          >
            {minutes} min
          </button>
        )
      })}
    </div>
  )
}

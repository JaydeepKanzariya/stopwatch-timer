import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import type { TimeParts } from '../types.ts'

interface TimerInputsProps {
  inputs: TimeParts
  isIdle: boolean
  isZeroDuration: boolean
  onChangeField: (field: keyof TimeParts, rawValue: string | number) => void
}

const FIELDS: ReadonlyArray<{
  key: keyof TimeParts
  id: string
  label: string
  max: number
}> = [
  { key: 'h', id: 'timer-hours', label: 'Hours', max: 99 },
  { key: 'm', id: 'timer-minutes', label: 'Minutes', max: 59 },
  { key: 's', id: 'timer-seconds', label: 'Seconds', max: 59 },
]

const BLOCKED_KEYS = new Set(['-', '+', '.', 'e', 'E'])

export function TimerInputs({
  inputs,
  isIdle,
  isZeroDuration,
  onChangeField,
}: TimerInputsProps) {
  const errorId = 'timer-zero-error'

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (BLOCKED_KEYS.has(event.key)) {
      event.preventDefault()
    }
  }

  const handlePaste =
    (field: keyof TimeParts) => (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const pasted = event.clipboardData.getData('text')
      onChangeField(field, pasted)
    }

  const handleChange =
    (field: keyof TimeParts) => (event: ChangeEvent<HTMLInputElement>) => {
      onChangeField(field, event.target.value)
    }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {FIELDS.map(({ key, id, label, max }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label
              htmlFor={id}
              className="text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300"
            >
              {label}
            </label>
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              step={1}
              disabled={!isIdle}
              value={String(inputs[key])}
              aria-invalid={isZeroDuration}
              aria-describedby={isZeroDuration ? errorId : undefined}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste(key)}
              onChange={handleChange(key)}
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg font-semibold text-slate-900 tabular-nums transition-colors focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500"
            />
          </div>
        ))}
      </div>

      {isZeroDuration && (
        <p
          id={errorId}
          className="text-center text-xs font-medium text-red-600 dark:text-red-400"
        >
          Set a time greater than 0
        </p>
      )}
    </div>
  )
}

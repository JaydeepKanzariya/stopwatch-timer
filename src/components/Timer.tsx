import type { UseTimerResult } from '../hooks/useTimer.ts'
import { Controls } from './Controls.tsx'
import { Presets } from './Presets.tsx'
import { ProgressRing } from './ProgressRing.tsx'
import { TimeDisplay } from './TimeDisplay.tsx'
import { TimerAlerts } from './TimerAlerts.tsx'
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
    notifyPermission,
    notifyEnabled,
    setField,
    setPreset,
    start,
    pause,
    reset,
    toggleMute,
    toggleNotify,
  } = timer

  const isIdle = canEdit
  const isFinished = status === 'finished'
  const displayValue = isFinished ? "Time's up" : formattedTime

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {isFinished
            ? 'Countdown complete'
            : status === 'running'
              ? 'Counting down'
              : status === 'paused'
                ? 'Paused'
                : 'Configure countdown'}
        </span>

        <TimerAlerts
          muted={muted}
          notifyPermission={notifyPermission}
          notifyEnabled={notifyEnabled}
          onToggleMute={toggleMute}
          onToggleNotify={toggleNotify}
        />
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
        <Presets inputs={inputs} isIdle={isIdle} onSelectPreset={setPreset} />

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

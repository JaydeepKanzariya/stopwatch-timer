import { useRef, type KeyboardEvent } from 'react'
import type { TabMode } from '../types.ts'

interface TabsProps {
  activeTab: TabMode
  onSelectTab: (tab: TabMode) => void
  stopwatchRunning: boolean
  timerRunning: boolean
  timerFinished: boolean
}

export function Tabs({
  activeTab,
  onSelectTab,
  stopwatchRunning,
  timerRunning,
  timerFinished,
}: TabsProps) {
  const stopwatchTabRef = useRef<HTMLButtonElement>(null)
  const timerTabRef = useRef<HTMLButtonElement>(null)

  const focusAndSelect = (targetTab: TabMode) => {
    onSelectTab(targetTab)
    if (targetTab === 'stopwatch') {
      stopwatchTabRef.current?.focus()
    } else {
      timerTabRef.current?.focus()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAndSelect(activeTab === 'stopwatch' ? 'timer' : 'stopwatch')
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAndSelect('stopwatch')
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAndSelect('timer')
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Clock mode"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800/90"
    >
      <button
        ref={stopwatchTabRef}
        id="tab-stopwatch"
        type="button"
        role="tab"
        aria-selected={activeTab === 'stopwatch'}
        aria-controls="panel-stopwatch"
        tabIndex={activeTab === 'stopwatch' ? 0 : -1}
        onClick={() => onSelectTab('stopwatch')}
        className={`relative flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
          activeTab === 'stopwatch'
            ? 'bg-teal-700 text-white shadow-sm dark:bg-teal-500 dark:text-slate-950'
            : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
        }`}
      >
        <span>Stopwatch</span>
        {stopwatchRunning && (
          <>
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                activeTab === 'stopwatch'
                  ? 'bg-white dark:bg-slate-950'
                  : 'bg-teal-500 dark:bg-teal-400'
              }`}
            />
            <span className="sr-only">{' (running)'}</span>
          </>
        )}
      </button>

      <button
        ref={timerTabRef}
        id="tab-timer"
        type="button"
        role="tab"
        aria-selected={activeTab === 'timer'}
        aria-controls="panel-timer"
        tabIndex={activeTab === 'timer' ? 0 : -1}
        onClick={() => onSelectTab('timer')}
        className={`relative flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
          activeTab === 'timer'
            ? 'bg-teal-700 text-white shadow-sm dark:bg-teal-500 dark:text-slate-950'
            : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
        }`}
      >
        <span>Timer</span>
        {timerFinished && (
          <>
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-red-500"
            />
            <span className="sr-only">{' (finished)'}</span>
          </>
        )}
        {timerRunning && (
          <>
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                activeTab === 'timer'
                  ? 'bg-white dark:bg-slate-950'
                  : 'bg-teal-500 dark:bg-teal-400'
              }`}
            />
            <span className="sr-only">{' (running)'}</span>
          </>
        )}
      </button>
    </div>
  )
}

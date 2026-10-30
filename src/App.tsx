import { useCallback, useState } from 'react'
import { Stopwatch } from './components/Stopwatch.tsx'
import { Tabs } from './components/Tabs.tsx'
import { Timer } from './components/Timer.tsx'
import { useDocumentTitle } from './hooks/useDocumentTitle.ts'
import { useShortcuts } from './hooks/useShortcuts.ts'
import { useStopwatch } from './hooks/useStopwatch.ts'
import { useTimer } from './hooks/useTimer.ts'
import type { TabMode } from './types.ts'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabMode>('stopwatch')
  const stopwatch = useStopwatch()
  const timer = useTimer()

  const stopwatchRunning = stopwatch.status === 'running'
  const timerRunning = timer.status === 'running'
  const timerFinished = timer.status === 'finished'

  useDocumentTitle({
    stopwatchRunning,
    stopwatchElapsedMs: stopwatch.elapsedMs,
    timerRunning,
    timerRemainingMs: timer.remainingMs,
  })

  const { toggle: toggleStopwatch, reset: resetStopwatch } = stopwatch
  const { toggle: toggleTimer, reset: resetTimer } = timer

  const handleToggleActive = useCallback(() => {
    if (activeTab === 'stopwatch') {
      toggleStopwatch()
    } else {
      toggleTimer()
    }
  }, [activeTab, toggleStopwatch, toggleTimer])

  const handleResetActive = useCallback(() => {
    if (activeTab === 'stopwatch') {
      resetStopwatch()
    } else {
      resetTimer()
    }
  }, [activeTab, resetStopwatch, resetTimer])

  useShortcuts({
    activeTab,
    onToggleActive: handleToggleActive,
    onResetActive: handleResetActive,
    onLapStopwatch: stopwatch.lap,
  })

  return (
    <div className="flex min-h-svh flex-col justify-between bg-slate-50 px-3 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-10">
      <header className="mx-auto w-full max-w-lg text-center">
        <div className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2.5" />
            <path d="M9 2h6" />
            <path d="M12 2v3" />
          </svg>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            Stopwatch &amp; Timer
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
          Precision timekeeping with split laps and custom countdowns
        </p>
      </header>

      <main className="mx-auto my-6 w-full max-w-lg">
        {/* Polite live region placed outside hidden panels so announcements work on either tab */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {timerFinished ? 'Timer finished' : ''}
        </div>

        <div
          className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-900 sm:p-6 ${
            timerFinished && activeTab === 'timer'
              ? 'border-red-400 dark:border-red-500/80'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Tabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            stopwatchRunning={stopwatchRunning}
            timerRunning={timerRunning}
            timerFinished={timerFinished}
          />

          <div
            id="panel-stopwatch"
            role="tabpanel"
            aria-labelledby="tab-stopwatch"
            hidden={activeTab !== 'stopwatch'}
            className="mt-6"
          >
            <Stopwatch stopwatch={stopwatch} />
          </div>

          <div
            id="panel-timer"
            role="tabpanel"
            aria-labelledby="tab-timer"
            hidden={activeTab !== 'timer'}
            className="mt-6"
          >
            <Timer timer={timer} />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-3.5 text-center text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-400">
            <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>
                <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Space
                </kbd>{' '}
                Start / Pause
              </span>
              <span>
                <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  R
                </kbd>{' '}
                Reset
              </span>
              <span>
                <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  L
                </kbd>{' '}
                Lap
              </span>
            </span>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-lg text-center text-xs text-slate-600 dark:text-slate-400">
        <span>&copy; 2026 Jaydeep Kanzariya</span>
        <span aria-hidden="true"> · </span>
        <a
          href="https://github.com/JaydeepKanzariya/stopwatch-timer"
          target="_blank"
          rel="noopener noreferrer"
          className="-my-3.5 inline-block rounded py-3.5 font-medium underline underline-offset-2 transition-colors hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:hover:text-teal-300 dark:focus-visible:ring-offset-slate-950"
        >
          Source on GitHub
        </a>
      </footer>
    </div>
  )
}

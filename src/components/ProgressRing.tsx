import type { ReactNode } from 'react'

interface ProgressRingProps {
  fraction: number
  isFinished: boolean
  children: ReactNode
}

const SIZE = 240
const STROKE_WIDTH = 8
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ProgressRing({
  fraction,
  isFinished,
  children,
}: ProgressRingProps) {
  const clampedFraction = Math.min(1, Math.max(0, fraction))
  const percent = Math.round(clampedFraction * 100)
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedFraction)

  return (
    <div
      role="progressbar"
      aria-label="Timer progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="relative mx-auto flex h-56 w-56 max-w-full items-center justify-center sm:h-64 sm:w-64"
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full -rotate-90 transform"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className={
            isFinished
              ? 'stroke-red-200 dark:stroke-red-950/80'
              : 'stroke-slate-200 dark:stroke-slate-800'
          }
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className={`transition-[stroke-dashoffset] duration-150 motion-reduce:transition-none ${
            isFinished
              ? 'stroke-red-500 dark:stroke-red-400'
              : 'stroke-teal-600 dark:stroke-teal-400'
          }`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        {children}
      </div>
    </div>
  )
}

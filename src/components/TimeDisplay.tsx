interface TimeDisplayProps {
  value: string
  isAlert?: boolean
  compact?: boolean
  sublabel?: string
}

export function TimeDisplay({
  value,
  isAlert = false,
  compact = false,
  sublabel,
}: TimeDisplayProps) {
  const isLongFormat = value.length > 8

  let sizeClasses: string
  if (isAlert) {
    sizeClasses = compact
      ? 'text-[clamp(1.75rem,7vw,2.75rem)]'
      : 'text-[clamp(2.25rem,9vw,4.5rem)]'
  } else if (compact) {
    sizeClasses = isLongFormat
      ? 'text-[clamp(1.5rem,6vw,2.5rem)]'
      : 'text-[clamp(1.85rem,7.5vw,3.1rem)]'
  } else {
    sizeClasses = isLongFormat
      ? 'text-[clamp(1.85rem,8vw,4.5rem)] sm:text-7xl'
      : 'text-[clamp(2.5rem,10.5vw,5.25rem)] sm:text-8xl'
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className={`max-w-full font-mono font-bold leading-none tracking-tight tabular-nums ${sizeClasses} ${
          isAlert
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-900 dark:text-slate-50'
        }`}
      >
        {value}
      </div>
      {sublabel && (
        <span className="mt-2 text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
          {sublabel}
        </span>
      )}
    </div>
  )
}

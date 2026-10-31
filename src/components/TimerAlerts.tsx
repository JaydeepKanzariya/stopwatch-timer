import type { NotifyPermission } from '../lib/notify.ts'

interface TimerAlertsProps {
  muted: boolean
  notifyPermission: NotifyPermission
  notifyEnabled: boolean
  onToggleMute: () => void
  onToggleNotify: () => void
}

const CHIP_BASE =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:focus-visible:ring-offset-slate-900'
const CHIP_ON =
  'border-teal-500/40 bg-teal-50/70 text-teal-800 hover:bg-teal-100/70 dark:border-teal-500/40 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/50'
const CHIP_OFF =
  'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-4 w-4',
} as const

export function TimerAlerts({
  muted,
  notifyPermission,
  notifyEnabled,
  onToggleMute,
  onToggleNotify,
}: TimerAlertsProps) {
  const notifyBlocked = notifyPermission === 'denied'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={muted}
        onClick={onToggleMute}
        className={`${CHIP_BASE} ${muted ? CHIP_OFF : CHIP_ON}`}
      >
        <svg {...ICON_PROPS}>
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          {muted ? (
            <>
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </>
          ) : (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          )}
        </svg>
        <span className="sr-only sm:not-sr-only">
          {muted ? 'Muted' : 'Sound on'}
        </span>
      </button>

      {notifyPermission !== 'unsupported' && (
        <button
          type="button"
          aria-pressed={notifyEnabled}
          disabled={notifyBlocked}
          title={
            notifyBlocked
              ? 'Notifications are blocked in your browser settings'
              : undefined
          }
          onClick={onToggleNotify}
          className={`${CHIP_BASE} ${notifyEnabled ? CHIP_ON : CHIP_OFF}`}
        >
          <svg {...ICON_PROPS}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            {!notifyEnabled && <line x1="3" y1="3" x2="21" y2="21" />}
          </svg>
          <span className="sr-only sm:not-sr-only">
            {notifyBlocked
              ? 'Blocked'
              : notifyEnabled
                ? 'Notify on'
                : 'Notify me'}
          </span>
        </button>
      )}
    </div>
  )
}

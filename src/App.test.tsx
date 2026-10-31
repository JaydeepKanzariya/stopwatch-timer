import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

const beep = vi.hoisted(() => ({
  playTimerBeep: vi.fn(),
  unlockAudioContext: vi.fn(),
  closeAudioContext: vi.fn(),
}))
vi.mock('./lib/beep.ts', () => beep)

const START_TIME = 1_700_000_000_000
const STOPWATCH_KEY = 'stopwatch-timer:stopwatch-v1'
const TIMER_STATE_KEY = 'stopwatch-timer:timer-state-v1'

function renderApp() {
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function stopwatchDisplay(): string {
  return screen.getAllByText(/^\d\d:\d\d\.\d\d$/)[0]?.textContent ?? ''
}

function timerDisplay(): string {
  return screen.getByText(/^\d\d:\d\d:\d\d$|^Time's up$/).textContent ?? ''
}

function openTimerTab() {
  fireEvent.click(screen.getByRole('tab', { name: /^Timer/ }))
}

function openStopwatchTab() {
  fireEvent.click(screen.getByRole('tab', { name: /^Stopwatch/ }))
}

function setTimer(minutes: string, seconds: string) {
  fireEvent.change(screen.getByLabelText('Minutes'), {
    target: { value: minutes },
  })
  fireEvent.change(screen.getByLabelText('Seconds'), {
    target: { value: seconds },
  })
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  })
  vi.setSystemTime(START_TIME)
  beep.playTimerBeep.mockClear()
  document.title = 'Stopwatch & Timer'
})

describe('stopwatch', () => {
  it('starts, pauses and resumes without losing time', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(1_500)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    const paused = stopwatchDisplay()
    expect(paused).toMatch(/^00:01\.[45]\d$/)

    tick(10_000)
    expect(stopwatchDisplay()).toBe(paused)

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    tick(1_000)
    expect(stopwatchDisplay()).toMatch(/^00:02\.[45]\d$/)
  })

  it('records laps newest first and clears them on reset', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(1_000)
    fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
    tick(2_000)
    fireEvent.click(screen.getByRole('button', { name: 'Lap' }))

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('#02')
    expect(rows[1]).toHaveTextContent('#01')

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(stopwatchDisplay()).toBe('00:00.00')
  })

  it('disables Reset when idle and Lap when not running', () => {
    renderApp()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Lap' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Lap' })).toBeEnabled()
  })

  it('keeps running while the Timer tab is open', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    openTimerTab()
    tick(3_000)
    openStopwatchTab()
    expect(Number(stopwatchDisplay().slice(3, 5))).toBeGreaterThanOrEqual(2)
  })
})

describe('timer', () => {
  it('rounds up and finishes exactly once, even on the other tab', () => {
    renderApp()
    openTimerTab()
    setTimer('0', '2')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(beep.unlockAudioContext).toHaveBeenCalled()

    tick(1_100)
    expect(timerDisplay()).toBe('00:00:01')

    openStopwatchTab()
    tick(1_100)
    expect(beep.playTimerBeep).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Timer finished')).toBeInTheDocument()

    tick(10_000)
    expect(beep.playTimerBeep).toHaveBeenCalledTimes(1)

    openTimerTab()
    expect(timerDisplay()).toBe("Time's up")
  })

  it('does not beep when muted', () => {
    renderApp()
    openTimerTab()
    fireEvent.click(screen.getByRole('button', { name: /Sound on/ }))
    setTimer('0', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(1_200)
    expect(beep.playTimerBeep).not.toHaveBeenCalled()
  })

  it('cannot start with zero time and shows the error', () => {
    renderApp()
    openTimerTab()
    setTimer('0', '0')
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
    expect(screen.getByText('Set a time greater than 0')).toBeInTheDocument()
  })

  it('locks the inputs while running and unlocks them after finishing', () => {
    renderApp()
    openTimerTab()
    setTimer('0', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByLabelText('Seconds')).toBeDisabled()
    tick(1_200)
    expect(screen.getByLabelText('Seconds')).toBeEnabled()
  })

  it('shows the countdown in the page title and a finished title after', () => {
    renderApp()
    openTimerTab()
    setTimer('0', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(1_100)
    expect(document.title).toBe('00:02 · Timer')
    tick(3_000)
    expect(document.title).toBe("Time's up · Timer")
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(document.title).toBe('Stopwatch & Timer')
  })
})

describe('keyboard shortcuts', () => {
  it('R and L still work after clicking a button, Space does not double-fire', () => {
    renderApp()
    const start = screen.getByRole('button', { name: 'Start' })
    start.focus()
    fireEvent.click(start)
    tick(500)

    fireEvent.keyDown(start, { key: 'l', code: 'KeyL' })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    const pause = screen.getByRole('button', { name: 'Pause' })
    fireEvent.keyDown(pause, { key: ' ', code: 'Space' })
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    fireEvent.keyDown(document.body, { key: ' ', code: 'Space' })
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()

    fireEvent.keyDown(pause, { key: 'r', code: 'KeyR' })
    expect(stopwatchDisplay()).toBe('00:00.00')
  })

  it('ignores shortcuts while typing in a field', () => {
    renderApp()
    openTimerTab()
    const minutes = screen.getByLabelText('Minutes')
    minutes.focus()
    fireEvent.keyDown(minutes, { key: ' ', code: 'Space' })
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })
})

describe('surviving a page reload', () => {
  it('restores a running stopwatch and the time that passed while away', () => {
    window.localStorage.setItem(
      STOPWATCH_KEY,
      JSON.stringify({
        status: 'running',
        accumulatedMs: 0,
        startedAtWall: START_TIME - 65_000,
        laps: [{ id: 1, lapNumber: 1, splitMs: 5_000, totalMs: 5_000 }],
      }),
    )
    renderApp()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(stopwatchDisplay()).toMatch(/^01:0[45]\.\d\d$/)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('saves a running stopwatch and restores it in a new mount', () => {
    const first = renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(2_000)
    fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
    first.unmount()

    // The page was closed for 10 seconds.
    vi.advanceTimersByTime(10_000)

    renderApp()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(Number(stopwatchDisplay().slice(0, 2))).toBe(0)
    expect(Number(stopwatchDisplay().slice(3, 5))).toBeGreaterThanOrEqual(11)
  })

  it('restores a running timer with the remaining time', () => {
    window.localStorage.setItem(
      'stopwatch-timer:timer-duration-v1',
      JSON.stringify({ h: 0, m: 1, s: 0 }),
    )
    window.localStorage.setItem(
      TIMER_STATE_KEY,
      JSON.stringify({
        status: 'running',
        remainingMs: 60_000,
        endAtWall: START_TIME + 30_000,
        runId: 1,
      }),
    )
    renderApp()
    openTimerTab()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(timerDisplay()).toMatch(/^00:00:(29|30)$/)

    tick(31_000)
    expect(timerDisplay()).toBe("Time's up")
    expect(beep.playTimerBeep).toHaveBeenCalledTimes(1)
  })

  it("shows Time's up, without a beep, if the timer ran out while away", () => {
    window.localStorage.setItem(
      TIMER_STATE_KEY,
      JSON.stringify({
        status: 'running',
        remainingMs: 1_000,
        endAtWall: START_TIME - 5_000,
        runId: 4,
      }),
    )
    renderApp()
    openTimerTab()
    expect(timerDisplay()).toBe("Time's up")
    tick(5_000)
    expect(beep.playTimerBeep).not.toHaveBeenCalled()
  })

  it('ignores corrupt saved data and starts fresh', () => {
    window.localStorage.setItem(STOPWATCH_KEY, '{not json')
    window.localStorage.setItem(
      TIMER_STATE_KEY,
      JSON.stringify({ status: 'x' }),
    )
    renderApp()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    expect(stopwatchDisplay()).toBe('00:00.00')
  })

  it('stops saving once the stopwatch is reset', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(window.localStorage.getItem(STOPWATCH_KEY)).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(window.localStorage.getItem(STOPWATCH_KEY)).toBeNull()
  })
})

describe('notifications', () => {
  class FakeNotification {
    static permission: NotificationPermission = 'default'
    static instances: FakeNotification[] = []
    static requestPermission = vi.fn(async () => {
      FakeNotification.permission = 'granted'
      return 'granted' as NotificationPermission
    })
    onclick: (() => void) | null = null
    title: string
    options?: NotificationOptions
    constructor(title: string, options?: NotificationOptions) {
      this.title = title
      this.options = options
      FakeNotification.instances.push(this)
    }
    close() {}
  }

  beforeEach(() => {
    FakeNotification.permission = 'default'
    FakeNotification.instances = []
    FakeNotification.requestPermission.mockClear()
  })

  it('hides the toggle where notifications are unsupported', () => {
    renderApp()
    openTimerTab()
    expect(
      screen.queryByRole('button', { name: /Notify/ }),
    ).not.toBeInTheDocument()
  })

  it('notifies only when the page is hidden', async () => {
    vi.stubGlobal('Notification', FakeNotification)
    renderApp()
    openTimerTab()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Notify me' }))
    })
    expect(FakeNotification.requestPermission).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Notify on' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    setTimer('0', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(1_200)
    await act(async () => {})
    expect(FakeNotification.instances).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick(1_200)
    await act(async () => {})
    expect(FakeNotification.instances).toHaveLength(1)
    expect(FakeNotification.instances[0]?.title).toBe("Time's up")
    Reflect.deleteProperty(document, 'hidden')
  })

  it('shows a disabled Blocked button when permission was denied', () => {
    FakeNotification.permission = 'denied'
    vi.stubGlobal('Notification', FakeNotification)
    renderApp()
    openTimerTab()
    expect(screen.getByRole('button', { name: 'Blocked' })).toBeDisabled()
  })
})

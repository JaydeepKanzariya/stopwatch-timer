import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TabMode } from '../types.ts'
import { Tabs } from './Tabs.tsx'

function setup(activeTab: TabMode = 'stopwatch') {
  const onSelectTab = vi.fn()
  render(
    <Tabs
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      stopwatchRunning={false}
      timerRunning={false}
      timerFinished={false}
    />,
  )
  return { onSelectTab, tablist: screen.getByRole('tablist') }
}

describe('Tabs', () => {
  it('marks only the active tab as selected and focusable', () => {
    setup('timer')
    const stopwatch = screen.getByRole('tab', { name: 'Stopwatch' })
    const timer = screen.getByRole('tab', { name: 'Timer' })
    expect(timer).toHaveAttribute('aria-selected', 'true')
    expect(stopwatch).toHaveAttribute('aria-selected', 'false')
    expect(timer).toHaveAttribute('tabindex', '0')
    expect(stopwatch).toHaveAttribute('tabindex', '-1')
  })

  it('connects each tab to its panel', () => {
    setup()
    expect(screen.getByRole('tab', { name: 'Stopwatch' })).toHaveAttribute(
      'aria-controls',
      'panel-stopwatch',
    )
    expect(screen.getByRole('tab', { name: 'Timer' })).toHaveAttribute(
      'aria-controls',
      'panel-timer',
    )
  })

  it.each([
    ['ArrowRight', 'stopwatch', 'timer'],
    ['ArrowLeft', 'stopwatch', 'timer'],
    ['ArrowRight', 'timer', 'stopwatch'],
    ['Home', 'timer', 'stopwatch'],
    ['End', 'stopwatch', 'timer'],
  ] as const)('%s on %s selects %s', (key, from, to) => {
    const { onSelectTab, tablist } = setup(from)
    fireEvent.keyDown(tablist, { key })
    expect(onSelectTab).toHaveBeenCalledWith(to)
  })

  it('ignores other keys', () => {
    const { onSelectTab, tablist } = setup()
    fireEvent.keyDown(tablist, { key: 'a' })
    expect(onSelectTab).not.toHaveBeenCalled()
  })

  it('announces running and finished states to screen readers', () => {
    render(
      <Tabs
        activeTab="stopwatch"
        onSelectTab={() => {}}
        stopwatchRunning
        timerRunning={false}
        timerFinished
      />,
    )
    expect(
      screen.getByRole('tab', { name: /^Stopwatch\s*\(running\)$/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /^Timer\s*\(finished\)$/ }),
    ).toBeInTheDocument()
  })
})

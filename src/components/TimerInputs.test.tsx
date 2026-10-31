import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TimerInputs } from './TimerInputs.tsx'

function setup(overrides: { isIdle?: boolean; isZeroDuration?: boolean } = {}) {
  const onChangeField = vi.fn()
  render(
    <TimerInputs
      inputs={{ h: 0, m: 5, s: 0 }}
      isIdle={overrides.isIdle ?? true}
      isZeroDuration={overrides.isZeroDuration ?? false}
      onChangeField={onChangeField}
    />,
  )
  return { onChangeField }
}

describe('TimerInputs', () => {
  it('labels all three fields', () => {
    setup()
    expect(screen.getByLabelText('Hours')).toHaveValue(0)
    expect(screen.getByLabelText('Minutes')).toHaveValue(5)
    expect(screen.getByLabelText('Seconds')).toHaveValue(0)
  })

  it('sets sensible limits and numeric keyboards', () => {
    setup()
    expect(screen.getByLabelText('Hours')).toHaveAttribute('max', '99')
    expect(screen.getByLabelText('Minutes')).toHaveAttribute('max', '59')
    expect(screen.getByLabelText('Seconds')).toHaveAttribute('max', '59')
    expect(screen.getByLabelText('Hours')).toHaveAttribute(
      'inputmode',
      'numeric',
    )
  })

  it('reports typed values for the field that changed', () => {
    const { onChangeField } = setup()
    fireEvent.change(screen.getByLabelText('Seconds'), {
      target: { value: '30' },
    })
    expect(onChangeField).toHaveBeenCalledWith('s', '30')
  })

  it('takes over paste so the raw text can be sanitised', () => {
    const { onChangeField } = setup()
    const input = screen.getByLabelText('Hours')
    const paste = createEvent.paste(input, {
      clipboardData: { getData: () => '-5' },
    })
    fireEvent(input, paste)
    expect(paste.defaultPrevented).toBe(true)
    expect(onChangeField).toHaveBeenCalledWith('h', '-5')
  })

  it.each(['-', '+', '.', 'e', 'E'])('blocks the %s key', (key) => {
    setup()
    const input = screen.getByLabelText('Minutes')
    const event = createEvent.keyDown(input, { key })
    fireEvent(input, event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('lets digits through', () => {
    setup()
    const input = screen.getByLabelText('Minutes')
    const event = createEvent.keyDown(input, { key: '7' })
    fireEvent(input, event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('disables every field while the timer is not idle', () => {
    setup({ isIdle: false })
    for (const label of ['Hours', 'Minutes', 'Seconds']) {
      expect(screen.getByLabelText(label)).toBeDisabled()
    }
  })

  it('links the zero-time error to the inputs', () => {
    setup({ isZeroDuration: true })
    const error = screen.getByText('Set a time greater than 0')
    for (const label of ['Hours', 'Minutes', 'Seconds']) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', error.id)
    }
  })

  it('shows no error for a valid time', () => {
    setup()
    expect(
      screen.queryByText('Set a time greater than 0'),
    ).not.toBeInTheDocument()
  })
})

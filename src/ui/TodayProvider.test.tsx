import { act, render, screen } from '@testing-library/react'
import { TodayProvider } from './TodayProvider'
import { useToday } from './todayContext'

function ShowToday() {
  return <p>{useToday()}</p>
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(new Date(2026, 9, 23, 23, 59, 30))
})
afterEach(() => {
  vi.useRealTimers()
})

it('byter datum strax efter midnatt', () => {
  render(
    <TodayProvider>
      <ShowToday />
    </TodayProvider>,
  )
  expect(screen.getByText('2026-10-23')).toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(60_000)
  })
  expect(screen.getByText('2026-10-24')).toBeInTheDocument()
})

it('kontrollerar datumet när appen visas igen', () => {
  render(
    <TodayProvider>
      <ShowToday />
    </TodayProvider>,
  )
  vi.setSystemTime(new Date(2026, 9, 26, 8, 0))
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(screen.getByText('2026-10-26')).toBeInTheDocument()
})

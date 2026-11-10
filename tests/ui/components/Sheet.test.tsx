import { act, fireEvent, render, screen } from '@testing-library/react'
import { Sheet } from '../../../src/ui/components/Sheet'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function renderSheet() {
  const onClose = vi.fn()
  render(
    <Sheet title="Havregryn" onClose={onClose}>
      <p>Innehåll</p>
    </Sheet>,
  )
  return { onClose, sheet: screen.getByRole('dialog') }
}

function drag(sheet: HTMLElement, distance: number) {
  fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
  fireEvent.touchMove(sheet, { touches: [{ clientY: 100 + distance / 2 }] })
  fireEvent.touchMove(sheet, { touches: [{ clientY: 100 + distance }] })
  fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 100 + distance }] })
  act(() => vi.runAllTimers())
}

it('stängs när man drar ner arket', () => {
  const { onClose, sheet } = renderSheet()
  drag(sheet, 200)
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('glider tillbaka efter ett kort och långsamt drag', () => {
  const { onClose, sheet } = renderSheet()
  fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
  fireEvent.touchMove(sheet, { touches: [{ clientY: 130 }] })
  vi.advanceTimersByTime(1000)
  fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 130 }] })
  act(() => vi.runAllTimers())
  expect(onClose).not.toHaveBeenCalled()
  expect(sheet.style.transform).toBe('')
})

it('scrollar innehållet i stället för att stängas när arket inte är högst upp', () => {
  const { onClose, sheet } = renderSheet()
  sheet.scrollTop = 50
  drag(sheet, 200)
  expect(onClose).not.toHaveBeenCalled()
})

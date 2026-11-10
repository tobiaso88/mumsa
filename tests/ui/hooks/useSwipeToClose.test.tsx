import { act, fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { useSwipeToClose } from '../../../src/ui/hooks/useSwipeToClose'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  window.scrollY = 0
})

function PageSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useSwipeToClose(ref, onClose, { page: true })
  return (
    <div data-testid="backdrop">
      <main ref={ref}>Skärm</main>
    </div>
  )
}

function drag(element: HTMLElement, distance: number) {
  fireEvent.touchStart(element, { touches: [{ clientY: 100 }] })
  fireEvent.touchMove(element, { touches: [{ clientY: 100 + distance }] })
  fireEvent.touchEnd(element, { changedTouches: [{ clientY: 100 + distance }] })
  act(() => vi.runAllTimers())
}

it('stänger en helskärm när man drar ner den högst upp på sidan', () => {
  const onClose = vi.fn()
  render(<PageSheet onClose={onClose} />)
  drag(screen.getByRole('main'), 200)
  expect(onClose).toHaveBeenCalledTimes(1)
  // Bakgrunden bakom en helskärm tonas inte ut
  expect(screen.getByTestId('backdrop').style.opacity).toBe('')
})

it('låter sidan scrolla när den inte är högst upp', () => {
  const onClose = vi.fn()
  render(<PageSheet onClose={onClose} />)
  window.scrollY = 300
  drag(screen.getByRole('main'), 200)
  expect(onClose).not.toHaveBeenCalled()
})

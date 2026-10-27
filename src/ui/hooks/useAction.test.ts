import { act, renderHook } from '@testing-library/react'
import { useAction } from './useAction'

afterEach(() => {
  vi.restoreAllMocks()
})

it('visar att skrivningen pågår och nollställer sedan', async () => {
  let finish = () => {}
  const action = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
  const { result } = renderHook(() => useAction(action, 'Fel'))

  let running: Promise<void> = Promise.resolve()
  act(() => {
    running = result.current.run()
  })
  expect(result.current.pending).toBe(true)

  await act(async () => {
    finish()
    await running
  })
  expect(result.current.pending).toBe(false)
  expect(result.current.error).toBeNull()
})

it('ger felmeddelandet när skrivningen misslyckas', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(() => useAction(() => Promise.reject(new Error('trasig')), 'Kunde inte spara.'))

  await act(() => result.current.run())
  expect(result.current.error).toBe('Kunde inte spara.')
  expect(result.current.pending).toBe(false)
})

it('nollställer felet vid nästa försök', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const action = vi.fn<() => Promise<void>>().mockRejectedValueOnce(new Error('trasig')).mockResolvedValueOnce()
  const { result } = renderHook(() => useAction(action, 'Kunde inte spara.'))

  await act(() => result.current.run())
  expect(result.current.error).toBe('Kunde inte spara.')
  await act(() => result.current.run())
  expect(result.current.error).toBeNull()
})

it('ignorerar nya anrop medan ett pågår', async () => {
  let finish = () => {}
  const action = vi.fn((value: number) => new Promise<void>((resolve) => (finish = () => resolve(void value))))
  const { result } = renderHook(() => useAction(action, 'Fel'))

  let first: Promise<void> = Promise.resolve()
  act(() => {
    first = result.current.run(1)
    void result.current.run(2)
  })
  await act(async () => {
    finish()
    await first
  })
  expect(action).toHaveBeenCalledTimes(1)
  expect(action).toHaveBeenCalledWith(1)
})

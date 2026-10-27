import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useAsync } from './useAsync'

afterEach(() => {
  vi.restoreAllMocks()
})

it('ger undefined medan det laddar och sedan värdet', async () => {
  const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
  expect(result.current).toBeUndefined()
  await waitFor(() => expect(result.current).toBe(42))
})

it('ger undefined direkt när deps ändras och ignorerar gamla svar', async () => {
  const resolvers = new Map<string, (value: string) => void>()
  const load = (key: string) => new Promise<string>((resolve) => resolvers.set(key, resolve))
  const { result, rerender } = renderHook(({ key }) => useAsync(() => load(key), [key]), { initialProps: { key: 'a' } })

  rerender({ key: 'b' })
  resolvers.get('a')?.('svar a')
  resolvers.get('b')?.('svar b')
  await waitFor(() => expect(result.current).toBe('svar b'))

  rerender({ key: 'c' })
  expect(result.current).toBeUndefined()
})

function Failing() {
  useAsync(() => Promise.reject(new Error('trasig')), [])
  return <p>Laddar</p>
}

it('kastar fel till närmaste ErrorBoundary', async () => {
  // React och ErrorBoundary loggar felet, vilket är väntat här
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <ErrorBoundary>
      <Failing />
    </ErrorBoundary>,
  )
  expect(await screen.findByRole('heading', { name: 'Något gick fel' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Ladda om' })).toBeInTheDocument()
})

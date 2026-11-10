import { renderHook } from '@testing-library/react'
import { useUpdateChecks } from '../../../src/ui/hooks/useUpdateChecks'

function fakeRegistration() {
  return { update: vi.fn().mockResolvedValue(undefined), installing: null } as unknown as ServiceWorkerRegistration & {
    update: ReturnType<typeof vi.fn>
  }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

describe('useUpdateChecks', () => {
  it('letar efter en ny version när appen blir synlig igen', () => {
    const reg = fakeRegistration()
    renderHook(() => useUpdateChecks(reg))
    setVisibility('hidden')
    expect(reg.update).not.toHaveBeenCalled()
    setVisibility('visible')
    expect(reg.update).toHaveBeenCalledTimes(1)
  })

  it('letar efter en ny version en gång i timmen', () => {
    vi.useFakeTimers()
    const reg = fakeRegistration()
    renderHook(() => useUpdateChecks(reg))
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(reg.update).toHaveBeenCalledTimes(1)
  })

  it('slutar lyssna när komponenten tas bort', () => {
    const reg = fakeRegistration()
    const { unmount } = renderHook(() => useUpdateChecks(reg))
    unmount()
    window.dispatchEvent(new Event('focus'))
    expect(reg.update).not.toHaveBeenCalled()
  })

  it('gör inget utan registrering', () => {
    expect(() => renderHook(() => useUpdateChecks(undefined))).not.toThrow()
  })
})

import { useRef, useState } from 'react'

/**
 * Kör en asynkron skrivning och håller reda på om den pågår och om den
 * misslyckades. Ett nytt anrop medan ett pågår ignoreras, så att en
 * dubbelklickning inte sparar två gånger.
 */
export function useAction<A extends unknown[]>(action: (...args: A) => Promise<void>, errorMessage: string) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const running = useRef(false)

  async function run(...args: A): Promise<void> {
    if (running.current) return
    running.current = true
    setPending(true)
    setError(null)
    try {
      await action(...args)
    } catch (e) {
      console.error(e)
      setError(errorMessage)
    } finally {
      running.current = false
      setPending(false)
    }
  }

  return { run, pending, error }
}

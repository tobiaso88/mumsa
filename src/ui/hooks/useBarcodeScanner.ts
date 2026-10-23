import { useEffect, useEffectEvent, useState, type RefObject } from 'react'
import { startScan } from '../../data/scanner'

/** Startar kameran medan active är sant och anropar onCode för varje avläst streckkod. */
export function useBarcodeScanner(videoRef: RefObject<HTMLVideoElement | null>, active: boolean, onCode: (code: string) => void) {
  const [error, setError] = useState<string | null>(null)
  const handleCode = useEffectEvent(onCode)

  useEffect(() => {
    const video = videoRef.current
    if (!active || !video) return
    let stop: (() => void) | undefined
    let cancelled = false
    startScan(video, (code) => handleCode(code))
      .then((stopScan) => {
        if (cancelled) stopScan()
        else stop = stopScan
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const denied = e instanceof DOMException && e.name === 'NotAllowedError'
        setError(denied ? 'Appen fick inte använda kameran.' : 'Kameran kunde inte startas.')
      })
    return () => {
      cancelled = true
      stop?.()
    }
  }, [videoRef, active])

  return error
}

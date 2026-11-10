import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useUpdateChecks } from '../hooks/useUpdateChecks'

const OFFLINE_NOTICE_MS = 5000

/** Visar en rad när en ny version av appen finns, eller när appen är redo att användas offline. */
export function UpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({ onRegisteredSW: (_url, reg) => setRegistration(reg) })
  useUpdateChecks(registration)

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), OFFLINE_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (needRefresh) {
    return (
      <div className="toast" role="status">
        <span>En ny version av Mumsa finns.</span>
        <button type="button" onClick={() => void updateServiceWorker()}>
          Uppdatera
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)} aria-label="Stäng">
          ×
        </button>
      </div>
    )
  }
  if (offlineReady) {
    return (
      <div className="toast" role="status">
        <span>Mumsa fungerar nu även offline.</span>
        <button type="button" onClick={() => setOfflineReady(false)} aria-label="Stäng">
          ×
        </button>
      </div>
    )
  }
  return null
}

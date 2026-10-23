import { useRegisterSW } from 'virtual:pwa-register/react'

/** Visar en rad när en ny version av appen finns, eller när appen är redo att användas offline. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

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

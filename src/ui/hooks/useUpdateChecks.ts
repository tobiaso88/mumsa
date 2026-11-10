import { useEffect } from 'react'

const CHECK_INTERVAL_MS = 60 * 60 * 1000

/**
 * Webbläsaren letar bara efter en ny service worker när sidan laddas. En installerad app
 * som återupptas från bakgrunden laddas inte om, så här kollar vi själva när appen blir
 * synlig igen och en gång i timmen medan den är öppen.
 */
export function useUpdateChecks(registration: ServiceWorkerRegistration | undefined) {
  useEffect(() => {
    if (!registration) return

    const check = () => {
      if (!navigator.onLine || registration.installing) return
      registration.update().catch(() => {
        // Nätverksfel vid kontrollen är ofarliga; vi försöker igen nästa gång.
      })
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    const timer = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
      clearInterval(timer)
    }
  }, [registration])
}

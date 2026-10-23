import { useEffect, useState } from 'react'
import { isStoragePersisted, requestPersistentStorage } from '../../data/storage'

/** null betyder att webbläsaren inte stöder beständig lagring. */
export function usePersistentStorage() {
  const [persisted, setPersisted] = useState<boolean | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    isStoragePersisted().then((value) => {
      if (!cancelled) setPersisted(value)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function request() {
    setPersisted(await requestPersistentStorage())
  }

  return { persisted, request }
}

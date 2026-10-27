import { useState } from 'react'
import { isStoragePersisted, requestPersistentStorage } from '../../data/storage'
import { useAsync } from './useAsync'

/** null betyder att webbläsaren inte stöder beständig lagring. */
export function usePersistentStorage() {
  // Ett fel här ska inte stoppa resten av appen, så det tolkas som att stöd saknas
  const initial = useAsync(() => isStoragePersisted().catch(() => null), [])
  const [requested, setRequested] = useState<boolean>()

  async function request() {
    setRequested(await requestPersistentStorage())
  }

  return { persisted: requested ?? initial, request }
}

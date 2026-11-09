/**
 * Beständig lagring gör att webbläsaren inte rensar datan automatiskt när
 * utrymmet tar slut. Ger null om webbläsaren inte stöder det.
 */
export async function isStoragePersisted(): Promise<boolean | null> {
  if (!navigator.storage?.persisted) return null
  return navigator.storage.persisted()
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  return navigator.storage.persist()
}

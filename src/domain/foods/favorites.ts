/** Lägger till id:t sist i listan, eller tar bort det om det redan finns. */
export function toggleFavorite(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((f) => f !== id) : [...ids, id]
}

export function isFavorite(ids: readonly string[], id: string): boolean {
  return ids.includes(id)
}

/** Slår ihop två listor utan dubbletter. Ordningen från a går först. */
export function mergeFavorites(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])]
}

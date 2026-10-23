import type { Food } from './types'

function normalize(text: string): string {
  return text.toLocaleLowerCase('sv').trim()
}

export function queryTerms(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean)
}

function searchableText(food: Food): string {
  return normalize(`${food.name} ${food.brand ?? ''}`)
}

/** Sant om alla sökord finns i namnet eller varumärket. */
export function matchesQuery(food: Food, terms: readonly string[]): boolean {
  if (terms.length === 0) return false
  const text = searchableText(food)
  return terms.every((t) => text.includes(t))
}

/** Lägre är bättre: exakt namn, namnet börjar med frågan, ett ord börjar med första sökordet, övrigt. */
function matchScore(food: Food, query: string, firstTerm: string): number {
  const name = normalize(food.name)
  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (name.split(/[\s,()/-]+/).some((w) => w.startsWith(firstTerm))) return 2
  return 3
}

/**
 * Filtrerar och rangordnar livsmedel efter en sökfråga. Egna livsmedel visas
 * först, sedan bästa träff, kortast namn och bokstavsordning.
 */
export function searchFoods(foods: readonly Food[], query: string, limit = 30): Food[] {
  const terms = queryTerms(query)
  const [firstTerm] = terms
  if (firstTerm === undefined) return []
  const normalized = terms.join(' ')
  return foods
    .filter((f) => matchesQuery(f, terms))
    .map((food) => ({ food, score: matchScore(food, normalized, firstTerm) }))
    .sort(
      (a, b) =>
        Number(b.food.source === 'custom') - Number(a.food.source === 'custom') ||
        a.score - b.score ||
        a.food.name.length - b.food.name.length ||
        a.food.name.localeCompare(b.food.name, 'sv'),
    )
    .slice(0, limit)
    .map(({ food }) => food)
}

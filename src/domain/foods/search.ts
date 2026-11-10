import type { Food } from '../types'

function normalize(text: string): string {
  return text.toLocaleLowerCase('sv').trim()
}

/** Utan mellanslag, så att "nötfärs" hittar Livsmedelsverkets "Nöt färs". */
function compact(text: string): string {
  return text.replace(/\s+/g, '')
}

/** å, ä och ö blir a, a och o, så att "notfars" hittar "nötfärs". */
function foldDiacritics(text: string): string {
  return text.replace(/[åä]/g, 'a').replace(/ö/g, 'o')
}

export function queryTerms(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean)
}

function searchableText(food: Food): string {
  return compact(normalize(`${food.name} ${food.brand ?? ''}`))
}

/** Hur många stavfel ett sökord får ha: inga i korta ord, ett från 5 tecken, två från 9. */
function allowedTypos(term: string): number {
  if (term.length >= 9) return 2
  if (term.length >= 5) return 1
  return 0
}

/**
 * Minsta antalet ändringar (byte, tillägg, borttag) som behövs för att sökordet ska
 * finnas någonstans i texten.
 */
export function substringDistance(term: string, text: string): number {
  // prev[i]: minsta ändringar för att term[0..i] ska sluta vid föregående tecken i texten.
  let prev = Array.from({ length: term.length + 1 }, (_, i) => i)
  let best = term.length
  for (const ch of text) {
    const curr = [0]
    let left = 0
    for (let i = 1; i <= term.length; i++) {
      const cost = term[i - 1] === ch ? 0 : 1
      left = Math.min((prev[i - 1] ?? 0) + cost, (prev[i] ?? 0) + 1, left + 1)
      curr.push(left)
    }
    best = Math.min(best, left)
    if (best === 0) return 0
    prev = curr
  }
  return best
}

function termMatchesFuzzy(term: string, foldedText: string): boolean {
  const folded = foldDiacritics(term)
  if (foldedText.includes(folded)) return true
  const max = allowedTypos(term)
  return max > 0 && substringDistance(folded, foldedText) <= max
}

/** Sant om alla sökord finns i namnet eller varumärket. Mellanslag i namnet räknas inte. */
export function matchesQuery(food: Food, terms: readonly string[]): boolean {
  if (terms.length === 0) return false
  const text = searchableText(food)
  return terms.every((t) => text.includes(t))
}

/** Som matchesQuery, men tål stavfel och å/ä/ö skrivna som a/o. */
export function matchesQueryFuzzy(food: Food, terms: readonly string[]): boolean {
  if (terms.length === 0) return false
  const text = foldDiacritics(searchableText(food))
  return terms.every((t) => termMatchesFuzzy(t, text))
}

/** Lägre är bättre: exakt träff, träff om å/ä/ö skrivs a/o, träff med stavfel. */
function matchTier(food: Food, terms: readonly string[]): number {
  if (matchesQuery(food, terms)) return 0
  const text = foldDiacritics(searchableText(food))
  if (terms.every((t) => text.includes(foldDiacritics(t)))) return 1
  return 2
}

/** Lägre är bättre: exakt namn, namnet börjar med frågan, ett ord börjar med första sökordet, övrigt. */
function matchScore(food: Food, query: string, firstTerm: string): number {
  const name = foldDiacritics(normalize(food.name))
  const q = foldDiacritics(query)
  if (name === q) return 0
  if (compact(name).startsWith(compact(q))) return 1
  if (name.split(/[\s,()/-]+/).some((w) => w.startsWith(foldDiacritics(firstTerm)))) return 2
  return 3
}

/** Egna livsmedel och recept visas före övriga träffar. */
const isOwn = (food: Food) => food.source === 'custom' || food.source === 'recipe'

/**
 * Filtrerar och rangordnar livsmedel efter en sökfråga. Exakta träffar visas först,
 * sedan träffar där å/ä/ö skrivits a/o och sist träffar med stavfel. Inom varje nivå
 * visas egna livsmedel och recept först, sedan bästa träff, kortast namn och bokstavsordning.
 */
export function searchFoods(foods: readonly Food[], query: string, limit = 30): Food[] {
  const terms = queryTerms(query)
  const [firstTerm] = terms
  if (firstTerm === undefined) return []
  const normalized = terms.join(' ')
  return foods
    .filter((f) => matchesQueryFuzzy(f, terms))
    .map((food) => ({
      food,
      tier: matchTier(food, terms),
      score: matchScore(food, normalized, firstTerm),
    }))
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        Number(isOwn(b.food)) - Number(isOwn(a.food)) ||
        a.score - b.score ||
        a.food.name.length - b.food.name.length ||
        a.food.name.localeCompare(b.food.name, 'sv'),
    )
    .slice(0, limit)
    .map(({ food }) => food)
}

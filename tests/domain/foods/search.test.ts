import {
  matchesQuery,
  matchesQueryFuzzy,
  queryTerms,
  searchFoods,
  substringDistance,
} from '../../../src/domain/foods/search'
import { makeFood } from '../../helpers/testData'
import type { Food } from '../../../src/domain/types'

const food = (name: string, overrides: Partial<Food> = {}) =>
  makeFood({ id: name, name, source: 'slv', ...overrides })

describe('queryTerms', () => {
  it('delar upp och gör om till gemener', () => {
    expect(queryTerms('  Mjölk  FETT ')).toEqual(['mjölk', 'fett'])
  })
})

describe('matchesQuery', () => {
  it('kräver att alla ord finns i namn eller varumärke', () => {
    const f = food('Havregryn', { brand: 'AXA' })
    expect(matchesQuery(f, ['havre', 'axa'])).toBe(true)
    expect(matchesQuery(f, ['havre', 'ica'])).toBe(false)
  })
  it('bortser från mellanslag i namnet', () => {
    expect(matchesQuery(food('Nöt färs rå fett 10%'), ['nötfärs'])).toBe(true)
  })
  it('matchar inget utan sökord', () => {
    expect(matchesQuery(food('Ägg'), [])).toBe(false)
  })
})

describe('substringDistance', () => {
  it('räknar ändringar mot bästa delsträng', () => {
    expect(substringDistance('mjolk', 'lattmjolk')).toBe(0)
    expect(substringDistance('mjlok', 'lattmjolk')).toBe(2)
    expect(substringDistance('notfrs', 'notfarsra')).toBe(1)
  })
})

describe('matchesQueryFuzzy', () => {
  const minced = food('Nöt färs rå fett 10%')
  it('tål å/ä/ö skrivna som a/o', () => {
    expect(matchesQueryFuzzy(minced, ['notfars'])).toBe(true)
  })
  it('tål ett stavfel i ord från fem tecken', () => {
    expect(matchesQueryFuzzy(minced, ['nötfärss'])).toBe(true)
    expect(matchesQueryFuzzy(minced, ['nötfrs'])).toBe(true)
  })
  it('kräver exakt träff för korta ord', () => {
    expect(matchesQueryFuzzy(food('Ost'), ['ist'])).toBe(false)
  })
  it('tål inte för många stavfel', () => {
    expect(matchesQueryFuzzy(minced, ['nytfors'])).toBe(false)
  })
})

describe('searchFoods', () => {
  const foods = [
    food('Choklad mjölk'),
    food('Mjölk fett 3%'),
    food('Kokosmjölk'),
    food('Mjölk'),
    food('Mjölkchoklad'),
    food('Gröt med mjölk', { source: 'custom' }),
    food('Bröd'),
  ]

  it('visar egna först, sedan exakt träff, prefix och ordstart', () => {
    expect(searchFoods(foods, 'mjölk').map((f) => f.name)).toEqual([
      'Gröt med mjölk',
      'Mjölk',
      'Mjölkchoklad',
      'Mjölk fett 3%',
      'Choklad mjölk',
      'Kokosmjölk',
    ])
  })

  it('begränsar antalet träffar', () => {
    expect(searchFoods(foods, 'mjölk', 2)).toHaveLength(2)
  })

  it('rangordnar sammanskrivna sökord som prefix', () => {
    const minced = [food('Lasagne nötfärs'), food('Nöt färs rå fett 10%'), food('Nöt entrecôte rå')]
    expect(searchFoods(minced, 'nötfärs').map((f) => f.name)).toEqual([
      'Nöt färs rå fett 10%',
      'Lasagne nötfärs',
    ])
  })

  it('visar exakta träffar före ungefärliga, även egna', () => {
    const list = [food('Vetemjöl', { source: 'custom' }), food('Mjölk fett 3%')]
    expect(searchFoods(list, 'mjölk').map((f) => f.name)).toEqual(['Mjölk fett 3%', 'Vetemjöl'])
  })

  it('rankar träff utan å/ä/ö före träff med stavfel', () => {
    const list = [food('Spenat färsk'), food('Nöt färs rå fett 10%')]
    expect(searchFoods(list, 'notfars').map((f) => f.name)).toEqual([
      'Nöt färs rå fett 10%',
      'Spenat färsk',
    ])
  })

  it('ger tom lista för tom fråga', () => {
    expect(searchFoods(foods, '   ')).toEqual([])
  })
})

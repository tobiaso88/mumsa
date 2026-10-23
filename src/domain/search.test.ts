import { matchesQuery, queryTerms, searchFoods } from './search'
import { makeFood } from './testData'
import type { Food } from './types'

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
  it('matchar inget utan sökord', () => {
    expect(matchesQuery(food('Ägg'), [])).toBe(false)
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

  it('ger tom lista för tom fråga', () => {
    expect(searchFoods(foods, '   ')).toEqual([])
  })
})

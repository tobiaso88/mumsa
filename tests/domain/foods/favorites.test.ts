import { isFavorite, mergeFavorites, toggleFavorite } from '../../../src/domain/foods/favorites'

describe('toggleFavorite', () => {
  it('lägger till ett livsmedel sist', () => {
    expect(toggleFavorite(['a', 'b'], 'c')).toEqual(['a', 'b', 'c'])
  })

  it('tar bort ett livsmedel som redan är en favorit', () => {
    expect(toggleFavorite(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })

  it('ändrar inte listan som skickades in', () => {
    const ids = ['a']
    toggleFavorite(ids, 'b')
    expect(ids).toEqual(['a'])
  })
})

it('känner igen en favorit', () => {
  expect(isFavorite(['a', 'b'], 'b')).toBe(true)
  expect(isFavorite(['a', 'b'], 'c')).toBe(false)
})

it('slår ihop listor utan dubbletter och behåller ordningen', () => {
  expect(mergeFavorites(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
})

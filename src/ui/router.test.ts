import { parseHash, toHash, type Route } from './router'

const today = '2026-10-23'

describe('parseHash', () => {
  it.each<[string, Route]>([
    ['', { name: 'day', date: today }],
    ['#/', { name: 'day', date: today }],
    ['#/dag/2026-10-20', { name: 'day', date: '2026-10-20' }],
    ['#/dag/ogiltigt', { name: 'day', date: today }],
    ['#/sok', { name: 'search' }],
    ['#/vecka/2026-10-19', { name: 'week', date: '2026-10-19' }],
    ['#/vecka', { name: 'week', date: today }],
    ['#/profil', { name: 'profile' }],
    ['#/okand', { name: 'day', date: today }],
  ])('tolkar %s', (hash, route) => {
    expect(parseHash(hash, today)).toEqual(route)
  })
})

describe('toHash', () => {
  it.each<Route>([
    { name: 'day', date: '2026-10-20' },
    { name: 'search' },
    { name: 'week', date: '2026-10-19' },
    { name: 'profile' },
  ])('går att tolka tillbaka: %o', (route) => {
    expect(parseHash(toHash(route), today)).toEqual(route)
  })
})

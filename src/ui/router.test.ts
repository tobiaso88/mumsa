import { parseHash, toHash, type Route } from './router'

const now = new Date(2026, 9, 23, 12, 30) // fredag lunchtid
const today = '2026-10-23'

describe('parseHash', () => {
  it.each<[string, Route]>([
    ['', { name: 'day', date: today }],
    ['#/', { name: 'day', date: today }],
    ['#/dag/2026-10-20', { name: 'day', date: '2026-10-20' }],
    ['#/dag/ogiltigt', { name: 'day', date: today }],
    ['#/lagg-till/2026-10-20/middag', { name: 'add', date: '2026-10-20', meal: 'dinner' }],
    ['#/lagg-till/2026-10-20/mellanmal', { name: 'add', date: '2026-10-20', meal: 'snack' }],
    ['#/lagg-till', { name: 'add', date: today, meal: 'lunch' }],
    ['#/lagg-till/2026-10-20/brunch', { name: 'add', date: today, meal: 'lunch' }],
    ['#/vecka/2026-10-19', { name: 'week', date: '2026-10-19' }],
    ['#/vecka', { name: 'week', date: today }],
    ['#/profil', { name: 'profile' }],
    ['#/okand', { name: 'day', date: today }],
  ])('tolkar %s', (hash, route) => {
    expect(parseHash(hash, now)).toEqual(route)
  })
})

describe('toHash', () => {
  it.each<Route>([
    { name: 'day', date: '2026-10-20' },
    { name: 'add', date: '2026-10-20', meal: 'breakfast' },
    { name: 'week', date: '2026-10-19' },
    { name: 'profile' },
  ])('går att tolka tillbaka: %o', (route) => {
    expect(parseHash(toHash(route), now)).toEqual(route)
  })
})

import { parseHash, toHash, type Route } from './router'

const now = new Date(2026, 9, 23, 12, 30) // fredag lunchtid
const today = '2026-10-23'

describe('parseHash', () => {
  it.each<[string, Route]>([
    ['', { name: 'day', date: today }],
    ['#/', { name: 'day', date: today }],
    ['#/dag/2026-10-20', { name: 'day', date: '2026-10-20' }],
    ['#/dag/ogiltigt', { name: 'day', date: today }],
    ['#/lagg-till/2026-10-20/middag', { name: 'add', date: '2026-10-20', meal: 'dinner', foodId: undefined }],
    ['#/lagg-till/2026-10-20/mellanmal', { name: 'add', date: '2026-10-20', meal: 'snack', foodId: undefined }],
    ['#/lagg-till', { name: 'add', date: today, meal: 'lunch' }],
    ['#/lagg-till/2026-10-20/brunch', { name: 'add', date: today, meal: 'lunch' }],
    ['#/lagg-till/2026-10-20/lunch/custom%3Aabc', { name: 'add', date: '2026-10-20', meal: 'lunch', foodId: 'custom:abc' }],
    ['#/skanna/2026-10-20/middag', { name: 'scan', date: '2026-10-20', meal: 'dinner' }],
    ['#/skanna', { name: 'scan', date: today, meal: 'lunch' }],
    ['#/livsmedel/ny/2026-10-20/lunch', { name: 'food', action: 'new', date: '2026-10-20', meal: 'lunch', ref: undefined }],
    ['#/livsmedel/ny/2026-10-20/lunch/7310130321184', { name: 'food', action: 'new', date: '2026-10-20', meal: 'lunch', ref: '7310130321184' }],
    ['#/livsmedel/kopiera/2026-10-20/lunch/slv%3A702', { name: 'food', action: 'copy', date: '2026-10-20', meal: 'lunch', ref: 'slv:702' }],
    ['#/livsmedel/andra/2026-10-20/lunch', { name: 'add', date: '2026-10-20', meal: 'lunch' }],
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
    { name: 'add', date: '2026-10-20', meal: 'breakfast', foodId: undefined },
    { name: 'add', date: '2026-10-20', meal: 'breakfast', foodId: 'off:7310130321184' },
    { name: 'scan', date: '2026-10-20', meal: 'snack' },
    { name: 'food', action: 'edit', date: '2026-10-20', meal: 'snack', ref: 'custom:a/b' },
    { name: 'food', action: 'new', date: '2026-10-20', meal: 'snack', ref: undefined },
    { name: 'week', date: '2026-10-19' },
    { name: 'profile' },
  ])('går att tolka tillbaka: %o', (route) => {
    expect(parseHash(toHash(route), now)).toEqual(route)
  })
})

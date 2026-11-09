import type { MumsaDb } from '../../../src/data/db/db'
import { createTestDb } from '../../helpers/testDb'
import { deleteWeight, getWeights, logWeight } from '../../../src/data/repos/weightsRepo'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

it('ger vägningarna äldst först', async () => {
  await logWeight(db, '2026-10-20', 71)
  await logWeight(db, '2026-10-01', 72)
  expect((await getWeights(db)).map((w) => w.date)).toEqual(['2026-10-01', '2026-10-20'])
})

it('ersätter en tidigare vägning samma dag', async () => {
  await logWeight(db, '2026-10-20', 71, new Date('2026-10-20T07:00:00Z'))
  await logWeight(db, '2026-10-20', 70.6, new Date('2026-10-20T19:00:00Z'))
  expect(await getWeights(db)).toEqual([{ date: '2026-10-20', kg: 70.6, createdAt: '2026-10-20T19:00:00.000Z' }])
})

it('tar bort en vägning', async () => {
  await logWeight(db, '2026-10-20', 71)
  await deleteWeight(db, '2026-10-20')
  expect(await getWeights(db)).toEqual([])
})

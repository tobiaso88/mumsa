import type { MumsaDb } from '../../../src/data/db/db'
import { createRecipe, deleteRecipe, getRecipe, getRecipes, listRecipes, updateRecipe } from '../../../src/data/repos/recipesRepo'
import { makeRecipe } from '../../helpers/testData'
import { createTestDb } from '../../helpers/testDb'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

const { id: _id, updatedAt: _updatedAt, ...input } = makeRecipe()

it('skapar, ändrar och tar bort ett recept', async () => {
  const recipe = await createRecipe(db, input, new Date('2026-10-01T00:00:00Z'))
  expect(recipe.id).toMatch(/^recipe:/)
  expect(recipe.updatedAt).toBe('2026-10-01T00:00:00.000Z')
  expect(await getRecipe(db, recipe.id)).toEqual(recipe)

  const updated = await updateRecipe(db, recipe.id, { ...input, servings: 4 }, new Date('2026-10-02T00:00:00Z'))
  expect(updated).toMatchObject({ id: recipe.id, servings: 4, updatedAt: '2026-10-02T00:00:00.000Z' })
  expect((await getRecipe(db, recipe.id))?.servings).toBe(4)

  await deleteRecipe(db, recipe.id)
  expect(await getRecipe(db, recipe.id)).toBeUndefined()
})

it('vägrar ändra ett recept som inte finns', async () => {
  await expect(updateRecipe(db, 'recipe:saknas', input)).rejects.toThrow('finns inte')
  expect(await db.recipes.count()).toBe(0)
})

it('listar recept sorterade på namn och hoppar över saknade id', async () => {
  const b = await createRecipe(db, { ...input, name: 'Pannkakor' })
  const a = await createRecipe(db, { ...input, name: 'Gröt' })
  expect((await listRecipes(db)).map((r) => r.name)).toEqual(['Gröt', 'Pannkakor'])
  expect((await getRecipes(db, [b.id, 'recipe:saknas', a.id])).map((r) => r.name)).toEqual(['Pannkakor', 'Gröt'])
})

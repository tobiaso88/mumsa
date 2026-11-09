import {
  isValidRecipe,
  isValidServings,
  recipeGrams,
  recipeNutrients,
  recipeNutrientsPerServing,
  recipeServingGrams,
  recipeToFood,
} from '../../../src/domain/recipes/recipes'
import { makeRecipe } from '../../helpers/testData'

// 100 g havregryn (370/13/59/7) och 300 g mjölk (60/3,4/4,8/3), två portioner
const recipe = makeRecipe()

describe('recipeNutrients', () => {
  it('summerar ingrediensernas näring efter mängd', () => {
    const total = recipeNutrients(recipe)
    expect(total.kcal).toBeCloseTo(550)
    expect(total.protein).toBeCloseTo(23.2)
    expect(total.carbs).toBeCloseTo(73.4)
    expect(total.fat).toBeCloseTo(16)
  })

  it('delar på antalet portioner', () => {
    expect(recipeNutrientsPerServing(recipe)?.kcal).toBeCloseTo(275)
    expect(recipeNutrientsPerServing({ ...recipe, servings: 2.5 })?.kcal).toBeCloseTo(220)
  })

  it('ger null för ogiltigt antal portioner', () => {
    expect(recipeNutrientsPerServing({ ...recipe, servings: 0 })).toBeNull()
    expect(recipeNutrientsPerServing({ ...recipe, servings: NaN })).toBeNull()
  })
})

describe('vikt', () => {
  it('summerar vikten och delar den på portionerna', () => {
    expect(recipeGrams(recipe)).toBe(400)
    expect(recipeServingGrams(recipe)).toBe(200)
  })
})

describe('recipeToFood', () => {
  it('ger näring per 100 g och en portion som totalvikten delad på portionerna', () => {
    const food = recipeToFood(recipe)
    expect(food).toMatchObject({ id: 'recipe:recipe-1', name: 'Havregrynsgröt', source: 'recipe', servingGrams: 200 })
    expect(food?.per100g.kcal).toBeCloseTo(137.5)
    expect(food?.per100g.protein).toBeCloseTo(5.8)
  })

  it('ger samma näring för en portion som receptet per portion', () => {
    const food = recipeToFood(recipe)!
    const perServing = recipeNutrientsPerServing(recipe)!
    expect((food.per100g.kcal * food.servingGrams!) / 100).toBeCloseTo(perServing.kcal)
  })

  it('ger null för ett recept utan vikt eller med ogiltigt antal portioner', () => {
    expect(recipeToFood({ ...recipe, ingredients: [] })).toBeNull()
    expect(recipeToFood({ ...recipe, servings: 0 })).toBeNull()
  })
})

describe('isValidServings', () => {
  it.each([1, 0.5, 2.5, 100])('godkänner %s', (n) => expect(isValidServings(n)).toBe(true))
  it.each([0, -1, 101, NaN, Infinity, null])('avvisar %s', (n) => expect(isValidServings(n)).toBe(false))
})

describe('isValidRecipe', () => {
  it('godkänner ett komplett recept', () => {
    expect(isValidRecipe(recipe)).toBe(true)
  })

  it.each([
    ['tomt namn', { name: '  ' }],
    ['inga ingredienser', { ingredients: [] }],
    ['noll portioner', { servings: 0 }],
    ['ingrediens utan mängd', { ingredients: [{ ...recipe.ingredients[0]!, grams: NaN }] }],
    ['ingrediens med noll gram', { ingredients: [{ ...recipe.ingredients[0]!, grams: 0 }] }],
    ['portion som är för stor för en loggpost', { servings: 0.01 }],
  ])('avvisar %s', (_, changes) => {
    expect(isValidRecipe({ ...recipe, ...changes })).toBe(false)
  })
})

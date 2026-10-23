import data from './livsmedelsverket.json'
import { loadSlvFoods } from './livsmedelsverket'

// Kontrollerar den buntade filen som skapas av scripts/build-livsmedel.ts
describe('buntad data från Livsmedelsverket', () => {
  it('har källa och licens', () => {
    expect(data.source).toBe('Livsmedelsverkets livsmedelsdatabas')
    expect(data.license).toBe('CC BY 4.0')
  })

  it('innehåller rimliga livsmedel med unika id', async () => {
    const foods = await loadSlvFoods()
    expect(foods.length).toBeGreaterThan(2000)
    expect(new Set(foods.map((f) => f.id)).size).toBe(foods.length)
    for (const f of foods) {
      expect(f.name).not.toBe('')
      const { kcal, protein, carbs, fat } = f.per100g
      expect([kcal, protein, carbs, fat].every((n) => Number.isFinite(n) && n >= 0)).toBe(true)
      // Fett redovisas så att rena fetter kan landa strax över 100 g, t.ex. matolja 102 g
      expect(protein + carbs + fat).toBeLessThanOrEqual(105)
    }
  })
})

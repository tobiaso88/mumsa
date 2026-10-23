import type { Food, LogEntry } from './types'

/** Hjälpare för att bygga testdata. Används bara i tester. */
export function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    name: 'Havregryn',
    source: 'custom',
    per100g: { kcal: 370, protein: 13, carbs: 59, fat: 7 },
    updatedAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  }
}

export function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 'entry-1',
    date: '2026-10-20',
    meal: 'breakfast',
    foodId: 'food-1',
    foodName: 'Havregryn',
    grams: 100,
    per100g: { kcal: 370, protein: 13, carbs: 59, fat: 7 },
    createdAt: '2026-10-20T07:30:00.000Z',
    ...overrides,
  }
}

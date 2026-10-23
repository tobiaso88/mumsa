import { defaultMealForHour } from './meals'

it.each([
  [4, 'snack'],
  [5, 'breakfast'],
  [9, 'breakfast'],
  [10, 'lunch'],
  [13, 'lunch'],
  [15, 'snack'],
  [17, 'dinner'],
  [20, 'dinner'],
  [22, 'snack'],
])('klockan %i föreslås %s', (hour, meal) => {
  expect(defaultMealForHour(hour)).toBe(meal)
})

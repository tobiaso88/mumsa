import { expect, test } from '@playwright/test'

test('första besöket visar introduktionen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Välkommen till Mumsa' })).toBeVisible()
})

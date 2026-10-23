import { expect, test } from '@playwright/test'

test('startsidan visar appens namn', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mumsa' })).toBeVisible()
})

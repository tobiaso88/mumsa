import { expect, type Page } from '@playwright/test'

/** Sätter ett manuellt mål via introduktionen och väntar på dagsvyn. */
export async function setGoal(page: Page, kcal = '2000') {
  await page.goto('/')
  await page.getByText('Ange själv').click()
  await page.getByLabel('Kalorimål per dag').fill(kcal)
  await page.getByRole('button', { name: 'Kom igång' }).click()
  await expect(page.getByRole('heading', { name: 'Idag' })).toBeVisible()
}

/** Fångar alla anrop till Open Food Facts så att testerna aldrig går ut på nätet. */
export async function mockOpenFoodFacts(page: Page, products: Record<string, unknown>) {
  await page.route('https://world.openfoodfacts.org/**', async (route) => {
    const code = /product\/(\d+)\.json/.exec(route.request().url())?.[1] ?? ''
    const product = products[code]
    await route.fulfill(
      product
        ? { json: { code, status: 1, product } }
        : { status: 404, json: { code, status: 0, status_verbose: 'product not found' } },
    )
  })
}

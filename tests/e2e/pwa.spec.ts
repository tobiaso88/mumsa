import { expect, test } from '@playwright/test'

test('manifestet beskriver en installerbar app', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'Mumsa – matlogg', short_name: 'Mumsa', lang: 'sv', display: 'standalone' })
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512', '512x512'])
})

test('appen och sökningen fungerar offline efter första besöket', async ({ page, context }) => {
  await page.goto('/')
  await page.getByText('Ange själv').click()
  await page.getByLabel('Kalorimål per dag').fill('2000')
  await page.getByRole('button', { name: 'Kom igång' }).click()
  await expect(page.getByRole('heading', { name: 'Idag' })).toBeVisible()

  // Vänta tills service workern har förcachat appen och tagit kontroll
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Idag' })).toBeVisible()

  await page.getByRole('link', { name: 'Lägg till i frukost' }).click()
  await page.getByRole('searchbox', { name: 'Sök livsmedel' }).fill('havregryn')
  await page.getByRole('button', { name: /Havregryn fullkorn/ }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Lägg till' }).click()
  await expect(page.getByRole('region', { name: 'Frukost' }).getByText('Havregryn fullkorn')).toBeVisible()
})

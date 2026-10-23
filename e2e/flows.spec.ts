import { expect, test } from '@playwright/test'
import { mockOpenFoodFacts, setGoal } from './helpers.ts'

test('räknar ut mål från profilen', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Vikt').fill('70')
  await page.getByLabel('Längd').fill('175')
  await page.getByLabel('Ålder').fill('30')
  await page.getByText('Man', { exact: true }).click()
  await page.getByLabel('Aktivitetsnivå').selectOption('moderate')
  await expect(page.getByText('2 556 kcal')).toBeVisible()
  await page.getByRole('button', { name: 'Kom igång' }).click()
  await expect(page.getByText('0 av 2 556 kcal')).toBeVisible()
})

test('loggar, ändrar och tar bort ett livsmedel från Livsmedelsverket', async ({ page }) => {
  await setGoal(page)
  await page.getByRole('link', { name: 'Lägg till i lunch' }).click()
  await page.getByRole('searchbox', { name: 'Sök livsmedel' }).fill('havregryn fullkorn')
  await page.getByRole('button', { name: /^Havregryn fullkorn/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Mängd', { exact: true }).fill('40')
  await dialog.getByRole('button', { name: 'Lägg till' }).click()

  const lunch = page.getByRole('region', { name: 'Lunch' })
  await expect(lunch.getByText('40 g · 150 kcal')).toBeVisible()
  await expect(page.getByText('1 850')).toBeVisible()

  await lunch.getByRole('button', { name: /Havregryn fullkorn/ }).click()
  await dialog.getByLabel('Mängd', { exact: true }).fill('80')
  await dialog.getByRole('button', { name: 'Spara' }).click()
  await expect(lunch.getByText('80 g · 300 kcal')).toBeVisible()

  await lunch.getByRole('button', { name: /Havregryn fullkorn/ }).click()
  await dialog.getByRole('button', { name: 'Ta bort' }).click()
  await expect(lunch.getByText('0 kcal', { exact: true })).toBeVisible()
})

test('skapar ett eget livsmedel och loggar det i portioner', async ({ page }) => {
  await setGoal(page)
  await page.getByRole('link', { name: 'Lägg till i mellanmål' }).click()
  await page.getByRole('link', { name: 'Eget livsmedel' }).click()
  await page.getByLabel('Namn').fill('Mormors bullar')
  await page.getByLabel('Energi').fill('350')
  await page.getByLabel('Protein').fill('7')
  await page.getByLabel('Kolhydrater').fill('50')
  await page.getByLabel('Fett').fill('13')
  await page.getByLabel('Portionsstorlek').fill('40')
  await page.getByLabel('Beskrivning').fill('1 bulle')
  await page.getByRole('button', { name: 'Spara livsmedel' }).click()

  const dialog = page.getByRole('dialog', { name: 'Mormors bullar' })
  await dialog.getByText('Portioner').click()
  await dialog.getByLabel('Mängd', { exact: true }).fill('2')
  await expect(dialog.getByText('Motsvarar 80 g.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Lägg till' }).click()
  await expect(page.getByRole('region', { name: 'Mellanmål' }).getByText('80 g · 280 kcal')).toBeVisible()
})

test('slår upp en streckkod hos Open Food Facts och använder den offline nästa gång', async ({ page, context }) => {
  await mockOpenFoodFacts(page, {
    '7310130321184': {
      product_name_sv: 'AXA Fiber havregryn',
      brands: 'AXA',
      nutriments: { 'energy-kcal_100g': 350, proteins_100g: 12, carbohydrates_100g: 69, fat_100g: 7 },
      serving_quantity: 40,
      serving_size: '1 portion',
    },
  })
  await setGoal(page)
  await page.getByRole('link', { name: 'Lägg till i frukost' }).click()
  await page.getByRole('link', { name: 'Skanna streckkod' }).click()
  await page.getByLabel('Eller skriv in streckkoden').fill('7310130321184')
  await page.getByRole('button', { name: 'Sök' }).click()
  await page.getByRole('dialog', { name: 'AXA Fiber havregryn, AXA' }).getByRole('button', { name: 'Lägg till' }).click()
  await expect(page.getByRole('region', { name: 'Frukost' }).getByText('40 g · 140 kcal')).toBeVisible()

  await context.setOffline(true)
  await page.getByRole('link', { name: 'Lägg till i lunch' }).click()
  await page.getByRole('link', { name: 'Skanna streckkod' }).click()
  await page.getByLabel('Eller skriv in streckkoden').fill('7310130321184')
  await page.getByRole('button', { name: 'Sök' }).click()
  await expect(page.getByRole('dialog', { name: 'AXA Fiber havregryn, AXA' })).toBeVisible()
})

test('erbjuder eget livsmedel för okänd streckkod', async ({ page }) => {
  await mockOpenFoodFacts(page, {})
  await setGoal(page)
  await page.goto('/#/skanna')
  await page.getByLabel('Eller skriv in streckkoden').fill('7310000000001')
  await page.getByRole('button', { name: 'Sök' }).click()
  await page.getByRole('link', { name: 'Skapa eget livsmedel' }).click()
  await expect(page.getByLabel('Streckkod (valfritt)')).toHaveValue('7310000000001')
})

test('exporterar och läser in all data på en ny enhet', async ({ page, browser }, testInfo) => {
  await setGoal(page, '1800')
  await page.getByRole('link', { name: 'Lägg till i middag' }).click()
  await page.getByRole('searchbox', { name: 'Sök livsmedel' }).fill('havregryn fullkorn')
  await page.getByRole('button', { name: /^Havregryn fullkorn/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Lägg till' }).click()
  await expect(page.getByRole('region', { name: 'Middag' }).getByText('100 g · 375 kcal')).toBeVisible()

  await page.goto('/#/installningar')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportera data' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^mumsa-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const file = testInfo.outputPath('backup.json')
  await download.saveAs(file)

  // En ny webbläsarkontext motsvarar en ny enhet utan data
  const other = await browser.newContext(testInfo.project.use)
  const newPage = await other.newPage()
  await newPage.goto('/')
  await newPage.getByRole('link', { name: /Importera en säkerhetskopia/ }).click()
  await newPage.getByLabel('Importera från fil').setInputFiles(file)
  await expect(newPage.getByText('Filen innehåller 0 livsmedel och 1 loggposter.')).toBeVisible()
  await newPage.getByRole('button', { name: 'Importera', exact: true }).click()
  await expect(newPage.getByText(/Klart!/)).toBeVisible()

  await newPage.goto('/')
  await expect(newPage.getByText('375 av 1 800 kcal')).toBeVisible()
  await expect(newPage.getByRole('region', { name: 'Middag' }).getByText('Havregryn fullkorn')).toBeVisible()
  await other.close()
})

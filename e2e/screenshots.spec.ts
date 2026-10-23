import { expect, test, type Page } from '@playwright/test'

// Tar skärmdumparna till README. Körs med `npm run screenshots`, inte i vanliga testkörningar.
const OUT = 'docs/screenshots'
const DEMO = 'e2e/fixtures/demo-backup.json'

// Utan service worker visas ingen notis om offlineläge på bilderna
test.use({ serviceWorkers: 'block' })

async function importDemo(page: Page) {
  await page.goto('/#/installningar')
  await page.getByLabel('Importera från fil').setInputFiles(DEMO)
  await page.getByRole('button', { name: 'Importera', exact: true }).click()
  await expect(page.getByText(/Klart!/)).toBeVisible()
}

test('skärmdumpar till README @skärmdump', async ({ page }) => {
  await importDemo(page)

  await page.goto('/#/dag/2026-10-22')
  await expect(page.getByRole('region', { name: 'Frukost' }).getByText('Havregryn fullkorn')).toBeVisible()
  await page.screenshot({ path: `${OUT}/dag.png` })

  await page.goto('/#/lagg-till/2026-10-22/middag')
  await page.getByRole('searchbox', { name: 'Sök livsmedel' }).fill('kyckling')
  await expect(page.getByRole('list', { name: 'Sökträffar' })).toBeVisible()
  await page.screenshot({ path: `${OUT}/sok.png` })

  await page.getByRole('button', { name: /^Kyckling bröstfilé färsk stekt/ }).click()
  await page.getByRole('dialog').getByLabel('Mängd', { exact: true }).fill('150')
  await page.screenshot({ path: `${OUT}/mangd.png` })

  await page.goto('/#/vecka/2026-10-22')
  await expect(page.getByRole('heading', { name: 'Vecka 43' })).toBeVisible()
  await page.screenshot({ path: `${OUT}/vecka.png` })

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/#/dag/2026-10-23')
  await expect(page.getByRole('region', { name: 'Frukost' })).toBeVisible()
  await page.screenshot({ path: `${OUT}/dag-morkt.png` })
})

test('skärmdump av introduktionen @skärmdump', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Vikt').fill('68')
  await page.getByLabel('Längd').fill('170')
  await page.getByLabel('Ålder').fill('36')
  await page.getByText('Kvinna', { exact: true }).click()
  await page.getByLabel('Aktivitetsnivå').selectOption('moderate')
  await expect(page.getByText(/Uppskattat behov/)).toBeVisible()
  await page.screenshot({ path: `${OUT}/introduktion.png` })
})

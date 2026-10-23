/**
 * Skapar appikonerna i public/ från iconSvg. Körs manuellt med
 * `npm run icons` när ikonen ändras. Renderar med Playwrights Chromium.
 */
import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { iconSvg } from './icon.ts'

const PUBLIC = new URL('../public/', import.meta.url)

const PNGS = [
  { file: 'icons/icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icons/icon-512.png', size: 512, rounded: true, scale: 1 },
  // Maskable ska fylla hela rutan och hålla motivet inom den säkra zonen (80 %)
  { file: 'icons/maskable-512.png', size: 512, rounded: false, scale: 0.72 },
  // iOS rundar hörnen själv och vill inte ha genomskinlighet
  { file: 'icons/apple-touch-icon.png', size: 180, rounded: false, scale: 0.85 },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size, rounded, scale } of PNGS) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${iconSvg({ rounded, scale })}`,
  )
  await page.screenshot({ path: new URL(file, PUBLIC).pathname, omitBackground: true })
  console.log(`Skrev public/${file}`)
}
await browser.close()
await writeFile(new URL('favicon.svg', PUBLIC), iconSvg({ rounded: true, scale: 1 }))
console.log('Skrev public/favicon.svg')

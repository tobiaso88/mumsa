/**
 * Hämtar Livsmedelsverkets livsmedelsdatabas och skriver en kompakt JSON-fil
 * som buntas med appen. Körs manuellt med `npm run data:livsmedel` när
 * databasen har uppdaterats. Appen själv anropar aldrig Livsmedelsverket.
 *
 * Källa: Livsmedelsverkets livsmedelsdatabas, licens CC BY 4.0.
 */
import { writeFile } from 'node:fs/promises'

const API = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1'
const OUT = new URL('../src/data/livsmedelsverket.json', import.meta.url)
const CONCURRENCY = 4

type ListItem = { nummer: number; namn: string }
type Naringsvarde = { namn: string; euroFIRkod: string; varde: number; enhet: string; viktGram: number }

/** [nummer, namn, kcal, protein, kolhydrater, fett] per 100 g ätlig del. */
type Row = [number, string, number, number, number, number]

async function getJson<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${API}${path}`)
    if (response.ok) return (await response.json()) as T
    if (attempt === 3) throw new Error(`${response.status} för ${path}`)
    await new Promise((r) => setTimeout(r, 1000 * attempt))
  }
}

function pick(values: Naringsvarde[], code: string, unit: string): number | undefined {
  const match = values.find((v) => v.euroFIRkod === code && v.enhet === unit && v.viktGram === 100)
  return typeof match?.varde === 'number' ? match.varde : undefined
}

async function toRow(item: ListItem): Promise<Row | null> {
  const values = await getJson<Naringsvarde[]>(`/livsmedel/${item.nummer}/naringsvarden?sprak=1`)
  const kcal = pick(values, 'ENERC', 'kcal')
  const protein = pick(values, 'PROT', 'g')
  const carbs = pick(values, 'CHO', 'g')
  const fat = pick(values, 'FAT', 'g')
  if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) return null
  return [item.nummer, item.namn.trim(), kcal, protein, carbs, fat]
}

async function main() {
  const list = await getJson<{ livsmedel: ListItem[] }>('/livsmedel?offset=0&limit=5000&sprak=1')
  const items = list.livsmedel
  const rows: Row[] = []
  let skipped = 0
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = await Promise.all(items.slice(i, i + CONCURRENCY).map(toRow))
    for (const row of batch) {
      if (row) rows.push(row)
      else skipped++
    }
    if (i % 200 === 0) console.log(`${i}/${items.length}`)
  }
  rows.sort((a, b) => a[0] - b[0])
  const data = {
    source: 'Livsmedelsverkets livsmedelsdatabas',
    license: 'CC BY 4.0',
    retrieved: new Date().toISOString().slice(0, 10),
    rows,
  }
  await writeFile(OUT, JSON.stringify(data) + '\n')
  console.log(`Skrev ${rows.length} livsmedel, hoppade över ${skipped} utan fullständig näring.`)
}

await main()

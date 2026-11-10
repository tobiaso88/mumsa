import type { Measures } from '../../domain/types'

/**
 * Hushållsmått från Livsmedelsverkets rapport "Volymvikter, viktförändringsfaktorer
 * och avfall" (PM 2024), tabell 1–13. Vikterna är uppmätta genomsnitt och därför
 * ungefärliga. Varje rad är [rapportens namn, gram per mått].
 */
export type VolymvikterDataset = {
  source: string
  title: string
  version: string
  url: string
  sha256: string
  rows: [string, Measures][]
}

/**
 * Livsmedelsverkets livsmedelsnummer kopplat till ett namn i rapporten. Rapporten
 * och livsmedelsdatabasen namnger livsmedel olika, så kopplingen görs för hand och
 * bara när det är samma vara i samma form. Havregrynsgröt och fiberhavregryn får
 * därför inte havregrynens mått.
 */
export const SLV_MEASURE_LINKS: Readonly<Record<number, string>> = {
  // Gryn, mjöl och flingor
  702: 'Havregryn',
  1941: 'Vetemjöl',
  6781: 'Cornflakes',
  3447: 'Havrefras',
  727: 'Frukostflingor, frostade, flingor',
  725: 'Frukostflingor, speciaflingor',
  710: 'Weetabix',
  719: 'Müsli',
  2024: 'Müsli',
  2025: 'Müsli',
  2033: 'Müsli',
  6764: 'Granola',
  830: 'Bulgur, tillagad',
  3136: 'Bulgur, tillagad',
  3564: 'Bulgur, tillagad',
  834: 'Hirs, kokt',
  7006: 'Hirs, kokt',
  6999: 'Havreris, kokt',
  6146: 'Mathavre, kokt',
  // Mjölk och mejeri
  123: 'Mjölk, standardmjölk 3% fett',
  150: 'Mjölk, mellanmjölk 1,5% fett',
  151: 'Mjölk, lättmjölk 0,5% fett',
  114: 'Filmjölk, naturell',
  6088: 'Filmjölk, naturell',
  1715: 'Vispgrädde, flytande',
  1719: 'Crème fraiche',
  7137: 'Crème fraiche',
  7138: 'Crème fraiche',
  7139: 'Crème fraiche, lätt',
  7140: 'Crème fraiche, lätt',
  147: 'Yoghurt, smaksatt',
  148: 'Yoghurt, smaksatt',
  7147: 'Yoghurt, smaksatt',
  7148: 'Yoghurt, smaksatt',
  6090: 'Kvarg, smaksatt',
  6091: 'Kvarg, smaksatt',
  2197: 'Äggröra tillagad',
  // Växtbaserat
  700: 'Havredryck',
  6795: 'Havredryck',
  6797: 'Havredryck',
  6813: 'Havredryck',
  672: 'Havredryck, smaksatt',
  6809: 'Havredryck, smaksatt',
  5963: 'Havredryck, smaksatt',
  907: 'Sojadryck',
  3668: 'Sojadryck',
  6902: 'Sojadryck',
  5150: 'Mandeldryck',
  6903: 'Mandeldryck',
  5956: 'Havregurt, naturell',
  7136: 'Soygurt, naturell',
  3051: 'Hummus',
  3602: 'Tahini',
  3820: 'Bruna bönor, kylvara, tillagade',
  // Frukt och grönt
  347: 'Majskorn, konserverade el. frysta',
  400: 'Majskorn, konserverade el. frysta',
  638: 'Fruktsallad, färsk, i bitar',
  601: 'Blåbär, torkade',
  6994: 'Mango, torkad, i bitar',
  5135: 'Mango, frysvara, i bitar',
  488: 'Bostongurka',
  420: 'Syltlök',
  // Pålägg, såser och övrigt
  1969: 'Tomatketchup',
  2004: 'Pesto',
  63: 'Bearnaisesås',
  2107: 'Skagenröra',
  3873: 'Skagenröra',
  3871: 'Rödbetssallad',
  7158: 'Rödbetssallad',
  1474: 'Leverpastej, bredbar',
  1477: 'Leverpastej, bredbar',
  1478: 'Leverpastej, bredbar',
  1275: 'Tonfisk i olja',
  1080: 'Renskav, stekt',
  1887: 'Chokladdryckspulver',
  1586: 'Popcorn, poppade',
  1626: 'Maränger, hela, medelstora',
  1624: 'Pepparkakor, medelstora',
}

/** Mått per livsmedelsnummer, för de livsmedel som har en koppling till rapporten. */
export function measuresByNummer(data: VolymvikterDataset): Map<number, Measures> {
  const byName = new Map(data.rows)
  const result = new Map<number, Measures>()
  for (const [nummer, name] of Object.entries(SLV_MEASURE_LINKS)) {
    const measures = byName.get(name)
    if (measures) result.set(Number(nummer), measures)
  }
  return result
}

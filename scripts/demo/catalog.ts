/**
 * Livsmedel och måltider som demodatan byggs av. Basvarorna är nummer i
 * Livsmedelsverkets databas, så att loggposterna får samma namn och
 * näringsvärden som appen visar. Egna och skannade livsmedel är påhittade,
 * med streckkoder i GS1-serien 200–299 som aldrig används på riktiga varor.
 */

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number }

/** Ett eget eller skannat livsmedel. since är dagen i dagboken då det lades till. */
export type ExtraFood = {
  key: string
  source: 'custom' | 'off'
  name: string
  brand?: string
  barcode?: string
  per100g: Nutrients
  servingGrams?: number
  servingLabel?: string
  since: number
}

/**
 * En del av en måltid. food är ett SLV-nummer eller nyckeln till ett extra
 * livsmedel. fixed betyder att mängden inte skalas efter dagens mål, till
 * exempel ett ägg eller en kopp kaffe. p är sannolikheten att delen är med.
 */
export type Portion = { food: number | string; grams: number; step?: number; fixed?: boolean; p?: number }

export type DayContext = {
  weekday: number
  month: number
  phase: 'lose' | 'maintain'
}

export type Template = {
  items: Portion[]
  weight: number
  /** Multiplikator för hur troligt mallen väljs en viss dag. */
  when?: (ctx: DayContext) => number
}

const p = (food: number | string, grams: number, extra: Omit<Portion, 'food' | 'grams'> = {}): Portion => ({
  food,
  grams,
  ...extra,
})
/** Styckvaror och drycker som loggas i hela enheter. */
const unit = (food: number | string, grams: number, extra: Omit<Portion, 'food' | 'grams'> = {}): Portion =>
  p(food, grams, { step: grams, fixed: true, ...extra })

const weekend = (ctx: DayContext) => ctx.weekday === 0 || ctx.weekday === 6
const summer = (ctx: DayContext) => ctx.month >= 6 && ctx.month <= 8
const winter = (ctx: DayContext) => ctx.month <= 3 || ctx.month >= 11

const COFFEE = [unit(1957, 200, { p: 0.85 }), unit(150, 30, { p: 0.85 })]

export const EXTRA_FOODS: ExtraFood[] = [
  {
    key: 'dagens',
    source: 'custom',
    name: 'Dagens lunch på jobbet',
    per100g: { kcal: 150, protein: 9, carbs: 15, fat: 6 },
    servingGrams: 450,
    servingLabel: '1 tallrik',
    since: 4,
  },
  {
    key: 'bulle-cafe',
    source: 'custom',
    name: 'Kanelbulle från caféet',
    per100g: { kcal: 380, protein: 6, carbs: 50, fat: 17 },
    servingGrams: 90,
    servingLabel: '1 bulle',
    since: 12,
  },
  {
    key: 'proteinbar',
    source: 'off',
    name: 'Proteinbar choklad och nougat',
    brand: 'Exempelfabriken',
    barcode: '2000000000015',
    per100g: { kcal: 360, protein: 33, carbs: 30, fat: 12 },
    servingGrams: 55,
    servingLabel: '1 bar',
    since: 38,
  },
  {
    key: 'knacke',
    source: 'off',
    name: 'Knäckebröd råg tunt',
    brand: 'Exempelbageriet',
    barcode: '2000000000022',
    per100g: { kcal: 350, protein: 10, carbs: 62, fat: 2 },
    servingGrams: 12,
    servingLabel: '1 skiva',
    since: 20,
  },
  {
    key: 'overnight',
    source: 'custom',
    name: 'Overnight oats med kvarg',
    per100g: { kcal: 140, protein: 8, carbs: 18, fat: 3.5 },
    servingGrams: 300,
    servingLabel: '1 burk',
    since: 120,
  },
  {
    key: 'proteinpudding',
    source: 'off',
    name: 'Proteinpudding choklad',
    brand: 'Mejeri Demo',
    barcode: '2000000000039',
    per100g: { kcal: 70, protein: 10, carbs: 5, fat: 1.5 },
    servingGrams: 200,
    servingLabel: '1 bägare',
    since: 210,
  },
  {
    key: 'granola',
    source: 'custom',
    name: 'Hemgjord granola',
    per100g: { kcal: 450, protein: 12, carbs: 55, fat: 20 },
    servingGrams: 50,
    servingLabel: '1 portion',
    since: 330,
  },
  {
    key: 'havreyoghurt',
    source: 'off',
    name: 'Havregurt vanilj',
    brand: 'Mejeri Demo',
    barcode: '2000000000046',
    per100g: { kcal: 72, protein: 1.2, carbs: 10, fat: 2.8 },
    servingGrams: 150,
    servingLabel: '1 bägare',
    since: 400,
  },
  {
    key: 'shake',
    source: 'custom',
    name: 'Proteinshake med mjölk',
    per100g: { kcal: 70, protein: 9, carbs: 5, fat: 1.3 },
    servingGrams: 350,
    servingLabel: '1 shaker',
    since: 520,
  },
]

export const BREAKFASTS: Template[] = [
  { weight: 40, items: [p(702, 45), p(150, 150, { step: 10 }), p(1798, 20, { p: 0.5 }), unit(553, 120, { p: 0.3 }), p(556, 50, { p: 0.3 }), ...COFFEE] },
  { weight: 18, items: [p(114, 250, { step: 10 }), p(712, 40), unit(553, 120, { p: 0.4 }), ...COFFEE] },
  { weight: 18, items: [unit(3795, 35), unit(3795, 35, { p: 0.7 }), p(6, 8), p(79, 20), p(1010, 20, { p: 0.5 }), p(364, 40, { p: 0.6 }), p(339, 30, { p: 0.4 }), ...COFFEE] },
  { weight: 12, items: [unit('knacke', 12), unit('knacke', 12), p(6, 6), unit(2205, 60), unit(2205, 60, { p: 0.4 }), p(1378, 10, { p: 0.6 }), ...COFFEE] },
  { weight: 10, items: [p(3243, 250, { step: 10 }), p(556, 75), p(719, 30), ...COFFEE], when: (c) => (c.phase === 'lose' ? 1.5 : 0.6) },
  { weight: 10, items: [unit('overnight', 300), ...COFFEE] },
  { weight: 8, items: [p(124, 200, { step: 10 }), p('granola', 50), p(526, 80, { p: 0.6 }), ...COFFEE] },
  { weight: 4, items: [unit('havreyoghurt', 150), p('granola', 40), ...COFFEE] },
  { weight: 10, items: [p(2197, 150), unit(200, 60), p(6, 8), p(79, 20), unit(641, 200), ...COFFEE], when: (c) => (weekend(c) ? 4 : 0) },
  { weight: 6, items: [p(2769, 200), p(1801, 30), p(1715, 30, { p: 0.6 }), ...COFFEE], when: (c) => (weekend(c) ? 3 : 0) },
]

export const LUNCHES: Template[] = [
  { weight: 30, items: [unit('dagens', 450), unit(3795, 35, { p: 0.4 }), p(6, 6, { p: 0.4 })], when: (c) => (weekend(c) ? 0 : 1) },
  { weight: 18, items: [p(1170, 130), p(2513, 180), p(2606, 100), p(1726, 30, { p: 0.6 })] },
  { weight: 12, items: [p(858, 400), p(390, 60, { p: 0.5 })] },
  { weight: 10, items: [p(1316, 125), p(231, 200), p(1726, 40), p(444, 60)] },
  { weight: 8, items: [p(897, 350, { step: 10 }), unit(3795, 35), p(6, 5)], when: (c) => (c.weekday === 4 ? 6 : winter(c) ? 1 : 0.4) },
  { weight: 6, items: [p(498, 350, { step: 10 }), unit(2205, 60), unit(200, 50)], when: (c) => (winter(c) ? 1.5 : 0.5) },
  { weight: 8, items: [p(513, 300), unit(200, 40)], when: (c) => (summer(c) ? 2 : 1) },
  { weight: 6, items: [p(2542, 350), p(390, 60)] },
  { weight: 6, items: [p(6391, 300), p(2513, 180)] },
  { weight: 4, items: [p(1363, 200), p(1366, 100)] },
  { weight: 3, items: [p(2506, 400)], when: (c) => (c.phase === 'lose' ? 0.4 : 1.5) },
  { weight: 5, items: [p(2899, 100), p(830, 180), p(444, 80)] },
  { weight: 4, items: [p(518, 450)] },
]

export const DINNERS: Template[] = [
  { weight: 14, items: [p(1106, 150), p(278, 250), p(1798, 25), p(2160, 50, { p: 0.4 })] },
  { weight: 12, items: [p(846, 250), p(1108, 200), p(103, 10, { p: 0.6 }), p(390, 60, { p: 0.4 })] },
  { weight: 12, items: [p(1170, 150), p(233, 220), p(1726, 40), p(2606, 100)] },
  { weight: 10, items: [p(1316, 140), p(231, 220), p(1726, 40), p(444, 80)] },
  { weight: 8, items: [p(1487, 150), p(278, 250), p(1969, 20)], when: (c) => (c.phase === 'lose' ? 0.5 : 1.3) },
  { weight: 8, items: [p(898, 350), p(2513, 150), p(1713, 30, { p: 0.5 })], when: (c) => (winter(c) ? 1.5 : 0.7) },
  { weight: 8, items: [p(2863, 300), p(2513, 180)] },
  { weight: 7, items: [p(1023, 150), p(233, 200), p(1726, 40), p(2606, 80)] },
  { weight: 6, items: [p(1336, 150), p(231, 200), p(25, 25)] },
  { weight: 6, items: [p(846, 250), p(2003, 30), p(1170, 100)] },
  { weight: 6, items: [p(6418, 350), p(2513, 150)] },
  { weight: 5, items: [p(7188, 350), unit(1233, 50), p(1798, 20, { p: 0.3 })] },
  { weight: 5, items: [p(511, 200), p(231, 200), p(1798, 25)], when: (c) => (winter(c) ? 1.5 : 0.3) },
  { weight: 5, items: [p(1192, 200), p(238, 200), p(2233, 30), p(444, 80)], when: (c) => (summer(c) ? 3 : 0.3) },
  { weight: 4, items: [p(1110, 150), unit(198, 70), p(245, 180), p(1969, 20)] },
  // Fredagsmys
  {
    weight: 0,
    items: [p(1124, 150), unit(5974, 40), unit(5974, 40), p(1713, 40), p(79, 25), p(364, 50), p(339, 40), p(347, 40), p(5916, 40)],
    when: (c) => (c.weekday === 5 ? 45 : c.weekday === 6 ? 6 : 0),
  },
  { weight: 0, items: [p(763, 450)], when: (c) => (c.weekday === 5 ? 20 : c.weekday === 6 ? 12 : 0) },
]

export const SNACKS: Template[] = [
  { weight: 20, items: [unit(553, 120)] },
  { weight: 14, items: [unit(588, 150)], when: (c) => (c.month >= 8 && c.month <= 11 ? 1.6 : 1) },
  { weight: 5, items: [unit(583, 160)] },
  { weight: 6, items: [unit(551, 150)], when: (c) => (winter(c) ? 2 : 0.5) },
  { weight: 12, items: [unit(1594, 45), unit(1957, 200), unit(150, 30)], when: (c) => (c.phase === 'lose' ? 0.5 : 1.4) },
  { weight: 4, items: [unit('bulle-cafe', 90), unit(2816, 300)], when: (c) => (weekend(c) ? 2 : 0.7) },
  { weight: 10, items: [p(6090, 150, { step: 10 })], when: (c) => (c.phase === 'lose' ? 1.5 : 0.7) },
  { weight: 6, items: [unit('proteinbar', 55)] },
  { weight: 5, items: [unit('proteinpudding', 200)] },
  { weight: 6, items: [unit('shake', 350)] },
  { weight: 8, items: [p(1562, 30)] },
  { weight: 6, items: [p(1575, 25)] },
  { weight: 6, items: [p(2052, 20)] },
  { weight: 5, items: [unit(224, 9), unit(224, 9), p(85, 10)] },
  { weight: 6, items: [unit('knacke', 12), p(6, 5), p(79, 15)] },
  { weight: 4, items: [unit(1614, 8), unit(1614, 8), unit(1614, 8), unit(1962, 250)] },
  { weight: 4, items: [p(587, 120)], when: (c) => (summer(c) ? 2 : 0.6) },
  { weight: 3, items: [p(1690, 100)], when: (c) => (summer(c) ? 4 : 0.3) },
]

/** Kvällssnacks fredag och lördag. */
export const TREATS: Template[] = [
  { weight: 10, items: [p(1584, 60)] },
  { weight: 8, items: [p(1863, 100)], when: (c) => (c.weekday === 6 ? 3 : 0.5) },
  { weight: 8, items: [p(2055, 40)] },
  { weight: 7, items: [unit(1907, 150), unit(1907, 150, { p: 0.6 })] },
  { weight: 6, items: [unit(1902, 330), unit(1902, 330, { p: 0.5 })], when: (c) => (summer(c) ? 2 : 1) },
  { weight: 5, items: [p(1586, 50)] },
  { weight: 3, items: [p(1690, 150)], when: (c) => (summer(c) ? 3 : 0.5) },
]

/** Högtider och andra dagar som ser annorlunda ut. Ersätter vanliga måltider. */
export type Feast = { lunch?: Portion[]; dinner?: Portion[]; snack?: Portion[] }

export const FEASTS: Readonly<Record<string, Feast>> = {
  julafton: {
    lunch: [p(3500, 80), p(974, 120), p(1106, 100), unit(1503, 60), p(257, 200), unit(3795, 40), p(6, 8)],
    dinner: [p(974, 80), p(257, 150), p(1106, 80), unit(1924, 40), unit(1902, 330)],
    snack: [unit(1624, 8), unit(1624, 8), unit(1624, 8), unit(1624, 8), unit(1912, 150), p(1848, 50), unit(6833, 50)],
  },
  juldagen: {
    lunch: [p(974, 100), p(257, 150), unit(3795, 35), p(6, 6)],
    snack: [unit(1624, 8), unit(1624, 8), unit(1624, 8), p(1848, 40)],
  },
  nyarsafton: {
    dinner: [p(1316, 160), p(233, 200), p(2231, 50), p(444, 60), unit(1908, 150), unit(1908, 150), unit(1908, 150), p(1648, 100)],
    snack: [p(1584, 50), unit(1908, 150)],
  },
  midsommarafton: {
    lunch: [p(3500, 100), p(236, 250), p(1713, 40), unit(2205, 60), unit(1902, 330), unit(1924, 40)],
    dinner: [p(1192, 200), p(261, 150), p(444, 80), unit(1907, 150), unit(1907, 150)],
    snack: [p(526, 150), p(1715, 40), p(1645, 120)],
  },
  paskafton: {
    lunch: [p(3500, 80), unit(2205, 60), unit(2205, 60), p(1285, 80), p(257, 150), unit(3795, 35), unit(1924, 40)],
    snack: [p(1848, 50)],
  },
  fettisdagen: { snack: [unit(1662, 120)] },
  kanelbullensdag: { snack: [unit('bulle-cafe', 90), unit(2816, 300)] },
  lucia: { snack: [unit(6833, 50), unit(1624, 8), unit(1624, 8), unit(1912, 150)] },
  fodelsedag: { dinner: [p(1023, 180), p(277, 200), p(444, 60), unit(1907, 150), unit(1907, 150)], snack: [p(1648, 120)] },
}

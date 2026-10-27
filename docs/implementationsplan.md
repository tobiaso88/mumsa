# Implementationsplan för kodanalysen

Planen följer [kodanalys.md](kodanalys.md) och är uppdelad i sex faser. Varje fas blir en egen commit, när det efterfrågas. Efter varje fas körs `npm test`, `npm run lint` och `npm run e2e`.

Inga nya beroenden behövs. Databasschemat ändras inte, så ingen Dexie-migrering krävs.

Status: fas 0–2 och 4 är committade. Fas 3 är uppskjuten efter mätning. Fas 5 återstår.

## Fas 0: Grunden i `domain/` (punkt 2, 3 och delvis 4)

Den här fasen ändrar inget beteende. Den lägger till funktioner som de senare faserna använder.

| Fil | Ändring |
|---|---|
| `src/domain/barcode.ts` + test (ny) | `normalizeBarcode()`, som tar bort blanksteg, och `isValidBarcode()`, som har regexen 6–14 siffror. |
| `src/domain/foodIds.ts` + test (ny) | `slvFoodId(n)`, `customFoodId(uuid)`, `offFoodId(barcode)` och `isSlvFoodId(id)`. |
| `src/domain/types.ts` | Lägger till `FOOD_SOURCES` och `SEXES` som `as const`. `FoodSource` och `Sex` härleds från dem. |
| `src/domain/goals.ts` + test | Konstanterna `GOAL_KCAL_MIN` och `GOAL_KCAL_MAX` samt `isValidGoalKcal()`. |
| `src/domain/nutrition.ts` + test | `MAX_ENTRY_GRAMS`, `isValidAmount()` och `gramsToPortions()`, som är motsatsen till `portionsToGrams`. |
| `src/domain/foodValidation.ts` + test | Gränserna 105 och 950 exporteras som namngivna konstanter. |

Sedan byts de kopierade reglerna ut mot de nya funktionerna i:

- `src/data/openFoodFacts.ts`
- `src/data/livsmedelsverket.ts`
- `src/data/foodsRepo.ts`
- `src/data/foodCatalog.ts`
- `src/ui/hooks/useFoodForm.ts`
- `src/ui/hooks/useGoalsForm.ts`
- `src/ui/hooks/useAmountForm.ts`
- `src/ui/screens/ScanScreen.tsx`
- `src/ui/components/FoodForm.tsx`, där felmeddelandena byggs från konstanterna.
- `src/ui/components/ProfileFields.tsx`, där `SEXES` används.

## Fas 1: Felhantering och hur UI:t når datalagret (punkt 1, 6 och 7)

| Fil | Ändring |
|---|---|
| `src/ui/components/ErrorBoundary.tsx` (ny) | Fångar fel vid läsning och visar ett felmeddelande med knappen "Ladda om". |
| `src/main.tsx` eller `src/ui/App.tsx` | Lägger `ErrorBoundary` runt `Shell`. |
| `src/ui/hooks/useLiveQuery.ts` | Sparar felet och kastar det i renderingen, så att `ErrorBoundary` fångar det. Anropen behöver inte ändras. |
| `src/ui/hooks/useAsync.ts` + test (ny) | Ersätter `cancelled`-mönstret och kastar fel på samma sätt. |
| `src/ui/hooks/useFoodSearch.ts`, `usePersistentStorage.ts` | Går över till `useAsync`. |
| `src/ui/hooks/useFood.ts` (ny) | `useFood(id)` via `useAsync`. Den ersätter de direkta anropen till `findFood` i `AddFoodScreen` och `FoodFormScreen`. |
| `src/ui/hooks/useAction.ts` + test (ny) | Omsluter en asynkron skrivning och håller reda på `pending` och `error`. |
| `src/ui/hooks/useEntryActions.ts`, `useFoodActions.ts`, `useSaveGoals.ts` (nya) | Samlar skrivningarna till datalagret. |
| `EditEntrySheet.tsx`, `GoalsForm.tsx`, `BackupSection.tsx`, `AddFoodScreen.tsx`, `FoodFormScreen.tsx` | Använder de nya hooksen och visar felmeddelanden med `role="alert"`. Knapparna är avstängda medan en skrivning pågår. |
| `src/ui/components/Loading.tsx` (ny) | Ersätter `return null` i `DayScreen`, `WeekScreen`, `ProfileScreen` och `FoodFormScreen`. |

`useBarcodeScanner` har redan egen felhantering. Där byts bara `cancelled`-mönstret ut om det går att göra utan att kodens flöde ändras.

## Fas 2: Import och export (punkt 4)

| Fil | Ändring |
|---|---|
| `src/domain/exportFormat.ts` + test | Använder `FOOD_SOURCES` och `SEXES`. Kontrollerar att id är unika och att id-prefixet stämmer med `source`. Tar hand om livsmedel med `source: 'slv'`, se beslut 1. Lägger till `migrateExport()`, som först bara gör v1 → v1. `version` får typen `number`, så att fler versioner kan stödjas senare. |
| `src/data/backup.ts` + test | `importAll` tar emot redan validerad `ExportData`, så att filen bara valideras en gång. Inställningarna sparas med `saveGoals` och `saveProfile` i samma transaktion som resten. `ImportOutcome` förenklas. |
| `src/data/backupFile.ts` + test | `readJsonFile` returnerar `{ ok, json }`, så att en fil som innehåller exakt `null` inte tolkas som ogiltig JSON. |
| `src/ui/hooks/useImport.ts` | Sparar bara `data` i statet. De långa raderna delas upp. |
| `src/ui/screens/settings.test.tsx` | Uppdateras efter de nya signaturerna. |

## Fas 3: Prestanda i sökningen (punkt 5) – uppskjuten

**Status:** uppskjuten 2026-10-27 efter mätning. Ingen kod är ändrad.

### Mätning

Uppmätt i dev-appen på en dator utan strypt processor, med koden från commit `85db95c`. Tiderna är snitt per anrop.

| Fall | Tid |
|---|---|
| `searchAllFoods`, inga sparade livsmedel | 1,3 ms |
| Varav att mappa om Livsmedelsverkets cirka 2 500 rader (`loadSlvFoods`) | 0,25 ms |
| Varav `searchFoods` över Livsmedelsverkets livsmedel | 0,8 ms |
| `searchAllFoods`, 500 sparade livsmedel | 5,1 ms |
| `searchAllFoods`, 2 000 sparade livsmedel | 12,0 ms |
| `findFood` för ett livsmedel från Livsmedelsverket | 0,1 ms |

### Slutsats

- Indexet nedan skulle bara spara under 1 ms per sökning. Sökningen väntar redan 150 ms medan användaren skriver, så skillnaden märks inte.
- Tiden växer med antalet sparade livsmedel, alltså egna och skannade. De läses från IndexedDB och normaliseras vid varje sökning, och det tar planen nedan inte hand om. Eftersom `searchFoods` bara tar 0,8 ms för 2 500 livsmedel går det mesta av tiden med många sparade livsmedel troligen åt till att läsa dem från databasen.
- En vanlig användare har troligen tiotals till några hundra sparade livsmedel, vilket ger några millisekunder per sökning.
- Kodanalysen överskattade alltså problemet. Fasen görs om först om sökningen märkbart känns långsam, och då i första hand för de sparade livsmedlen. Mät igen på en riktig mobil innan dess.

### Ursprunglig plan, inte genomförd

| Fil | Ändring |
|---|---|
| `src/domain/search.ts` + test | Söktexten normaliseras en gång per livsmedel och skickas in färdig, i stället för att räknas om vid varje sökning. |
| `src/data/livsmedelsverket.ts` | `buildSlvIndex()` ger `{ foods, byId: Map, searchItems }`. |
| `src/data/foodCatalog.ts` + test | Tar emot indexet i stället för att mappa om alla rader vid varje anrop. `findFood` slår upp i `Map`. |
| `src/ui/DbProvider.tsx` och `dbContext.ts` | Skapar indexet en gång, när det behövs första gången, och håller det i context bredvid `db`. Se beslut 2. |

## Fas 4: Dubbletter i UI:t (punkt 8)

| Fil | Ändring |
|---|---|
| `src/ui/components/MacroProgress.tsx` (ny) | De fyra staplarna. Används i `DaySummary.tsx` och `WeekScreen.tsx`. |
| `src/ui/components/PeriodHeader.tsx` (ny) | Rubriken med föregående och nästa. Används i `DayHeader.tsx` och `WeekScreen.tsx`. |
| `src/ui/components/SegmentedControl.tsx` (ny) | Får sitt `name` från `useId`. Används i `AmountForm`, `BackupSection`, `GoalsForm` och `ProfileFields`. |
| `src/ui/components/TextField.tsx` (ny) | Den gemensamma basen. `NumberField` bygger på den, och den interna kopian i `FoodForm.tsx` tas bort. |
| `BackupSection.tsx`, `ScanScreen.tsx` | De hårdkodade id:na byts mot `useId`. |

**Kontroll i den här fasen:** om e2e-testerna eller `e2e/helpers.ts` hittar element via `#import-file` eller `#manual-barcode` behöver de i stället hitta dem via etiketten.

## Fas 5: Läsbarhet

| Fil | Ändring |
|---|---|
| `src/ui/router.ts` + test | `food`-routen får `barcode?` och `foodId?` i stället för `ref`. Adresserna i hashen ser likadana ut som i dag. |
| `src/ui/App.tsx`, `FoodFormScreen.tsx`, `AddFoodScreen.tsx`, `ScanScreen.tsx` | Följer det nya route-formatet. |
| `src/ui/screens/AddFoodScreen.tsx` | En ny `SearchResults`-komponent ersätter de nästlade ternarierna. |
| `src/ui/components/SplitFields.tsx` | Ternarin byts mot tidiga returer. |
| `src/ui/hooks/useGoalsForm.ts` | Procentfälten använder `toInputText`. |
| `src/ui/hooks/useToday.ts` + test (ny) | Ger dagens datum och uppdateras vid midnatt och när appen visas igen. Används i `BottomNav`, `DayHeader`, `WeekScreen` och `useRoute`. |
| `src/ui/components.css` | Delas upp i några filer under `src/ui/styles/`, se beslut 4. |

## Varför den här ordningen

- **Fas 0 kommer först** eftersom de andra faserna bygger på funktionerna där. Den ändrar inget beteende, så risken är låg.
- **Fas 1 kommer före fas 2** så att import och export redan har ett ställe att visa fel på.
- **Fas 2 bör vara klar** innan export- eller databasformatet ändras första gången.
- **Fas 3–5** beror inte på varandra och kan skjutas upp eller göras i en annan ordning.

## Beslut

1. **Livsmedel med `source: 'slv'` i en importfil.** Avgjort i fas 2: de hoppas över och antalet visas före och efter importen.
2. **Var indexet för Livsmedelsverket ska ligga.** Inte aktuellt så länge fas 3 är uppskjuten. Om fasen tas upp igen gäller fortfarande att CLAUDE.md förbjuder state i moduler.
3. **Hur fel visas.** Avgjort i fas 1: `ErrorBoundary` för fel vid läsning och meddelanden i formuläret för fel vid skrivning.
4. **Uppdelningen av `components.css`.** Öppet. Den ger minst nytta av allt i planen och kan strykas.
5. **Felmeddelandet om makron.** Avgjort i fas 0: makrotexten säger "100 g" och bara energitexten byggs från konstanten.

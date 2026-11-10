# Mumsa

En enkel och gratis matlogg för mobilen. Sätt ett dagligt mål, logga vad du äter per måltid och se hur dagen och veckan ligger till. Ingen inloggning, ingen reklam och ingen betalvägg. All data stannar på din enhet.

**Öppna appen:** https://tobiaso88.github.io/mumsa/

| Dag | Sök | Mängd | Vecka |
| --- | --- | --- | --- |
| ![Dagsvy](docs/screenshots/dag.png) | ![Sök livsmedel](docs/screenshots/sok.png) | ![Ange mängd](docs/screenshots/mangd.png) | ![Veckovy](docs/screenshots/vecka.png) |

| Introduktion | Mörkt läge |
| --- | --- |
| ![Introduktion](docs/screenshots/introduktion.png) | ![Dagsvy i mörkt läge](docs/screenshots/dag-morkt.png) |

## Funktioner

- Kalorimål och fördelning av protein, kolhydrater och fett. Du anger målet själv eller låter appen uppskatta det utifrån vikt, längd, ålder och aktivitetsnivå. Uppskattningen är ingen rekommendation eller medicinsk bedömning.
- Välj ett mål: gå ner i vikt, behålla vikten, gå upp i vikt eller bygga muskler, med lugn eller måttlig takt. Det uppskattade behovet justeras med en tumregel om ungefär 7 700 kcal per kilo, och fördelningen av energi fylls i som en utgångspunkt som du kan ändra.
- Logga din vikt, sätt en målvikt och följ förändringen i en viktkurva.
- Sök bland cirka 2 600 livsmedel från Livsmedelsverket. Sökningen fungerar offline.
- Skanna streckkoder med kameran. Produkter hämtas från Open Food Facts.
- Egna livsmedel, och rättade kopior av livsmedel med fel värden.
- Egna recept av ingredienser och antal portioner. Ett recept loggas som en eller flera portioner.
- Logga i gram eller portioner, per frukost, lunch, middag och mellanmål. Vanliga basvaror som havregryn, vetemjöl, mjölk och filmjölk går också att ange i dl, msk eller tsk, med vikter från Livsmedelsverket. Egna livsmedel kan få en vikt per dl.
- Kopiera en tidigare måltid till dagen du tittar på, till exempel gårdagens frukost, så slipper du logga samma mat igen.
- Snabbregistrera bara kalorier när du inte vet vad maten innehåller. Protein, kolhydrater och fett räknas då inte med.
- Markera livsmedel och recept som favoriter. De visas överst när du ska lägga till något.
- Dagsvy med intag mot målet och veckovy med diagram och snitt.
- Export och import av all data som JSON.
- Installeras som app på mobilen och fungerar offline.

## Så lagras din data

- Allt du loggar, även vägningar, sparas i webbläsarens IndexedDB på din enhet. Det finns ingen server, inget konto och ingen synk mellan enheter.
- Livsmedelsverkets livsmedelsdatabas och deras tabell över hushållsmått följer med appen som filer. Sökningar skickas därför inte någonstans.
- Det som loggas sparas alltid i gram. En mängd i dl eller msk räknas om när du loggar, så en senare ändring av vikten per dl påverkar inte gamla poster.
- Det enda nätverksanropet är uppslag av streckkoder hos Open Food Facts. Bara streckkoden skickas. Produkter som hämtats sparas lokalt och fungerar offline nästa gång.
- Om du rensar webbplatsdata i webbläsaren försvinner loggen. Under Profil → Inställningar kan du exportera en säkerhetskopia och be webbläsaren om beständig lagring.
- För att flytta till en ny enhet: exportera på den gamla och välj ”Importera en säkerhetskopia” på den nya.
- Där webbläsaren stöder det finns även ”Dela eller spara i molnet”, som öppnar telefonens delningsmeny så att du kan lägga säkerhetskopian i Filer, iCloud Drive eller Google Drive. Appen skickar själv ingenting till molnet, så det är en manuell säkerhetskopia och ingen automatisk synk.
- Exportfilen är JSON i formatversion 4, som innehåller livsmedel, recept, loggposter, mål, profil, vägningar och favoriter. Filer från version 1, 2 och 3 går fortfarande att importera.

## Installera på mobilen

- **iPhone:** öppna appen i Safari, tryck på Dela och välj *Lägg till på hemskärmen*.
- **Android:** öppna appen i Chrome och välj *Installera app* i menyn.

## Utveckling

Kräver Node 24.

```bash
npm install
```

| Kommando | Vad det gör |
| --- | --- |
| `npm run dev` | Startar utvecklingsservern |
| `npm run build` | Bygger till `dist/` |
| `npm test` | Kör enhetstester (Vitest) |
| `npm run e2e` | Kör end-to-end-tester (Playwright) mot det byggda resultatet |
| `npm run lint` | Kör ESLint och typkontroll |
| `npm run screenshots` | Tar om skärmdumparna i `docs/screenshots/` |
| `npm run icons` | Skapar appikonerna i `public/` |
| `npm run data:livsmedel` | Hämtar Livsmedelsverkets databas till `src/data/sources/livsmedelsverket.json` |

Koden är uppdelad i tre lager: `src/domain/` (rena beräkningar), `src/data/` (IndexedDB, Open Food Facts, kamera och filer) och `src/ui/` (React). Inom `domain/` och `data/` ligger filerna i undermappar per område, till exempel `domain/goals/` och `data/repos/`. Alla tester ligger i `tests/`, som speglar strukturen i `src/`, och end-to-end-testerna i `tests/e2e/`. GitHub Actions kör lint och alla tester vid varje push och publicerar till GitHub Pages från `main`.

## Källor och licenser

- Livsmedelsverkets livsmedelsdatabas, licens [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.sv). Källa: Livsmedelsverket.
- Hushållsmått (dl, msk, tsk och styck) från Livsmedelsverkets rapport [Volymvikter, viktförändringsfaktorer och avfall, PM 2024](https://www.livsmedelsverket.se/globalassets/publikationsdatabas/pm/2024/pm-2024-volymvikter-viktforandringsfaktorer-och-avfall.pdf), tabell 1–13. Vikterna är uppmätta genomsnitt och visas som ungefärliga. Rapportens namn är kopplade för hand till livsmedelsdatabasen i `src/data/sources/volymvikter.ts`, och bara när det är samma vara i samma form.
- Produktdata från [Open Food Facts](https://world.openfoodfacts.org), licens ODbL.

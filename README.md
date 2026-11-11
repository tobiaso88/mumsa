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

## Kom igång

### Krav

- Node 24 och npm
- Inga externa tjänster, konton eller API-nycklar. Streckkodsuppslagen mot Open Food Facts kräver ingen nyckel.

### Installation

```bash
git clone https://github.com/tobiaso88/mumsa
cd mumsa
npm install
```

### Konfiguration

Ingen `.env`-fil behövs. Den enda miljövariabeln är `BASE_PATH`, som anger sökvägen appen serveras från. Den är `/` om den inte är satt, och GitHub Actions sätter den till `/mumsa/` när appen byggs för GitHub Pages.

### Kör projektet

```bash
npm run dev
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
| `npm run data:demo` | Skapar en påhittad dagbok i `demo/` som kan importeras i appen |

## Arkitektur

Appen är en statisk webbapp utan backend och är uppdelad i tre lager. `src/domain/` innehåller rena funktioner och typer, till exempel näringsberäkningar, summering per dag och målberäkning, utan React eller I/O. `src/data/` är det enda lagret som pratar med omvärlden: IndexedDB, Open Food Facts, kameran och filer för import och export. Det returnerar domäntyper, så resten av appen känner inte till Open Food Facts format. `src/ui/` innehåller React-komponenter och hooks, som hämtar data via `data/` och låter `domain/` göra alla beräkningar.

```
mumsa/
├── src/
│   ├── domain/        # Rena beräkningar och typer: foods, nutrition, goals, recipes, weight, backup
│   ├── data/          # IndexedDB (db, repos), livsmedelskällor, säkerhetskopior och streckkodsskanner
│   ├── ui/            # React-skärmar, komponenter, hooks och stilar
│   └── main.tsx       # Startpunkt
├── tests/             # Speglar src/, plus e2e/ (Playwright), helpers/ och fixtures/
├── scripts/           # Hämtar Livsmedelsverkets data, skapar ikoner och demodata
├── public/            # Favicon och appikoner
├── docs/              # Skärmdumpar och planeringsdokument
├── .github/workflows/ # Lint, tester, bygge och publicering till GitHub Pages
└── vite.config.ts     # Bygge och PWA-inställningar (manifest och service worker)
```

## Teknisk stack

| Komponent | Val | Anledning |
| --- | --- | --- |
| Språk och ramverk | TypeScript, React | Typkontroll fångar fel i näringsberäkningarna, och React är väletablerat för ett mobilgränssnitt |
| Bygge | Vite | Snabb utvecklingsmiljö och bygger till statiska filer som kan ligga på GitHub Pages |
| Installation och offline | vite-plugin-pwa | Appen kan läggas på hemskärmen och fungerar offline via en service worker |
| Lagring | IndexedDB via Dexie | All data stannar i webbläsaren, så ingen backend eller inget konto behövs. Dexie sköter schemamigreringar |
| Livsmedelsdata | Livsmedelsverkets livsmedelsdatabas | Öppen data (CC BY 4.0) om svenska basvaror. Den följer med appen, så sökningen fungerar offline |
| Streckkoder | Open Food Facts API | Öppen och gratis, med bra täckning av svenska produkter |
| Kamera | BarcodeDetector med @zxing/browser som reserv | Webbläsarens inbyggda avläsare där den finns, och zxing i till exempel Safari |
| Tester | Vitest, Testing Library, Playwright | Enhetstester för all logik i `domain/` och end-to-end-tester av de viktigaste flödena |
| CI/CD | GitHub Actions, GitHub Pages | Lint, tester och bygge vid varje push och pull request, och publicering vid push till `main`. Inga hemligheter behövs |

## Begränsningar

- Ingen synk mellan enheter. Data flyttas bara genom att exportera och importera en säkerhetskopia för hand.
- Datan finns bara i webbläsaren. Om man rensar webbplatsdata eller avinstallerar appen försvinner loggen, om man inte har en säkerhetskopia. På iPhone kan Safari dessutom rensa data för webbplatser som inte har använts på länge.
- Sökningen omfattar bara Livsmedelsverkets cirka 2 600 basvaror och egna livsmedel. Märkesvaror hittas bara genom att skanna streckkoden, eftersom Open Food Facts fritextsökning inte går att anropa från webbläsaren.
- Näringsvärden från Open Food Facts läggs in av användare och kan vara ofullständiga eller fel. De går att rätta genom att spara en egen kopia.
- Skanning av nya produkter kräver nätverk. Allt annat fungerar offline.
- Uppskattade kalorimål bygger på allmänna formler och är ingen medicinsk rekommendation.
- Gränssnittet finns bara på svenska.

## Utvecklat med

Claude Code (agentdriven utveckling) som del av kursen Next-Generation Software Development with AI.

## Källor och licenser

- Livsmedelsverkets livsmedelsdatabas, licens [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.sv). Källa: Livsmedelsverket.
- Hushållsmått (dl, msk, tsk och styck) från Livsmedelsverkets rapport [Volymvikter, viktförändringsfaktorer och avfall, PM 2024](https://www.livsmedelsverket.se/globalassets/publikationsdatabas/pm/2024/pm-2024-volymvikter-viktforandringsfaktorer-och-avfall.pdf), tabell 1–13. Vikterna är uppmätta genomsnitt och visas som ungefärliga. Rapportens namn är kopplade för hand till livsmedelsdatabasen i `src/data/sources/volymvikter.ts`, och bara när det är samma vara i samma form.
- Produktdata från [Open Food Facts](https://world.openfoodfacts.org), licens ODbL.

# CLAUDE.md – Mumsa

> Arbetsnamn. Appen är inspirerad av Lifesum men har eget namn, egen design och ingen koppling till Lifesums varumärke eller kod.

## Vad projektet gör

Mumsa är en webbapp för att logga vad man äter och följa sitt kalori- och makrointag. Man sätter ett dagligt mål, söker eller skannar livsmedel, loggar dem per måltid och ser hur dagen och veckan ligger till mot målet. Appen går att installera på mobilen som PWA och fungerar offline.

## Problemet det löser

De stora kostappar som finns är låsta bakom abonnemang, kräver konto och samlar in hälsodata. Många vill bara ha en enkel, gratis logg där datan stannar på den egna enheten. Mumsa är till för vem som helst som vill hålla koll på vad hen äter utan konto, reklam eller betalvägg.

## Funktioner i MVP

1. Profil och mål: kalorimål och fördelning av protein, kolhydrater och fett (manuellt eller beräknat från vikt, längd, ålder och aktivitetsnivå).
2. Sök livsmedel i Livsmedelsverkets livsmedelsdatabas (buntad med appen) och bland egna och tidigare skannade livsmedel, och logga mängd i gram eller portioner, uppdelat på frukost, lunch, middag och mellanmål.
3. Streckkodsskanning med mobilens kamera.
4. Egna livsmedel för det som saknas eller är fel i databasen.
5. Dagsvy med intag mot mål och veckovy med enkel graf.
6. Export och import av all data som JSON, så att användaren kan flytta eller säkerhetskopiera den.

## Tillagt efter MVP

- Målval (gå ner, behålla, gå upp, bygga muskler) med takt, som justerar det uppskattade behovet.
- Viktlogg med målvikt och viktkurva.
- Egna recept av ingredienser och portioner, som loggas som portioner, även direkt från receptredigeraren.
- Hushållsmått (dl, msk, tsk, st) med vikter från Livsmedelsverkets volymviktsrapport (`src/data/sources/volymvikter.ts`). Allt sparas ändå i gram.
- Kopiera en tidigare måltid, snabbregistrering av bara kalorier och favoriter.
- Feltolerant sökning (mellanslag, diakritiska tecken och stavfel).
- Mörkt läge, introduktion vid första start och delning av säkerhetskopia via telefonens delningsmeny.
- Exportformatet är version 4. Äldre versioner (1–3) ska fortsätta gå att importera.

Utanför scope: konton, synk mellan enheter, kostplaner, AI-funktioner (övervägt och bortvalt), Apple Health och Google Fit.

## Teknikstack och varför

- **TypeScript + React + Vite**: väletablerat, snabb utvecklingsmiljö och bygger till statiska filer som kan ligga på GitHub Pages.
- **vite-plugin-pwa**: installerbar app och offlinestöd via service worker.
- **IndexedDB via Dexie**: all användardata lagras lokalt i webbläsaren. Ingen backend att drifta.
- **Open Food Facts API**: öppen och gratis livsmedelsdatabas med bra täckning av svenska produkter. Används bara för streckkodsuppslag, eftersom deras fritextsökning inte går att anropa från webbläsaren (CORS).
- **Livsmedelsverkets livsmedelsdatabas** (CC BY 4.0): cirka 2 600 basvaror buntade som JSON i `src/data/sources/livsmedelsverket.json` för fritextsökning offline. Uppdateras med `npm run data:livsmedel`. Livsmedelsverket ska anges som källa i appen och i README.
- **BarcodeDetector-API:t** med **@zxing/browser** som reserv för webbläsare som saknar det (till exempel Safari).
- **Vitest** och **Testing Library** för tester, **Playwright** för några end-to-end-flöden.
- **GitHub Actions** bygger, testar och deployar till GitHub Pages vid push till `main`.

## Arkitekturprinciper

- **Tre lager**:
  - `src/domain/` innehåller rena funktioner och typer: näringsberäkningar, summering per dag, målberäkning. Ingen React, ingen I/O. Filerna ligger i undermappar per område (`foods/`, `nutrition/`, `goals/`, `recipes/`, `weight/`, `backup/`); `types.ts` och `dates.ts` delas av alla och ligger direkt i `domain/`.
  - `src/data/` är det enda lagret som pratar med omvärlden: IndexedDB, Open Food Facts och kameran. Exponerar enkla funktioner som returnerar domäntyper. Uppdelat i `db/` (Dexie och lagring), `repos/` (läsning och skrivning per tabell), `sources/` (Livsmedelsverket, Open Food Facts och den samlade livsmedelskatalogen), `backup/` och `scanner/`.
  - `src/ui/` innehåller React-komponenter och hooks. Komponenter anropar `data/` via hooks och räknar aldrig näringsvärden själva.
- Data från Open Food Facts mappas till egna domäntyper direkt i `data/`. Resten av appen känner inte till API:ts format.
- Näringsvärden lagras per 100 g och räknas om vid visning. Avrundning sker bara i UI:t.
- Inga globala variabler. Delad state hålls i React context eller i databasen, inte i moduler.
- Funktioner och komponenter gör en sak. En komponent som växer över cirka 150 rader delas upp.
- Allt i `domain/` har enhetstester.
- Tester ligger i `tests/`, som speglar `src/`: testet för `src/domain/goals/goals.ts` ligger i `tests/domain/goals/goals.test.ts`. Testhjälpare finns i `tests/helpers/`, fixturer i `tests/fixtures/` och Playwright-testerna i `tests/e2e/`. Inga tester eller testhjälpare i `src/`.
- Appen ska fungera utan nätverk för allt utom sökning och skanning av nya livsmedel, som cachas lokalt när de väl hämtats.
- Gränssnittet är på svenska och mobilen är förstahandsplattform.

## Det här ska agenten INTE göra

- Inte lägga till externa beroenden utan att fråga först.
- Inte införa backend, konton, analysverktyg eller något som skickar användardata från enheten. Enda nätverksanropen går till Open Food Facts.
- Inte byta ramverk, byggverktyg eller lagringslösning.
- Inte använda Lifesums namn, logotyp, färger, texter eller bilder.
- Inte ändra databasschemat utan en Dexie-migrering som behåller befintlig användardata.
- Inte ge medicinska råd eller presentera beräknade mål som rekommendationer från expert.
- Inte ta bort eller hoppa över tester för att få bygget grönt.
- Inte committa eller pusha utan att jag uttryckligen ber om det.

## Kommandon

- `npm run dev` startar utvecklingsservern
- `npm run build` bygger till `dist/`
- `npm test` kör enhetstester
- `npm run e2e` kör Playwright-tester
- `npm run lint` kör eslint och typkontroll
- `npm run screenshots` tar om skärmdumparna i `docs/screenshots/`
- `npm run icons` skapar appikonerna i `public/`
- `npm run data:livsmedel` hämtar Livsmedelsverkets databas
- `npm run data:demo` skapar en påhittad dagbok i `demo/` att importera

Node 24 krävs. Ingen `.env` behövs; `BASE_PATH` sätts bara av GitHub Actions vid bygge för Pages.

## CI/CD

`.github/workflows/deploy.yml` kör lint, enhetstester, Playwright och bygge vid push och pull request, och publicerar till GitHub Pages (https://tobiaso88.github.io/mumsa/) vid push till `main`. Inga GitHub Secrets behövs.

## Definition av klart

Appen är publicerad på GitHub Pages, går att installera på iPhone och Android, klarar MVP-funktionerna ovan och har en README med skärmdumpar och förklaring av hur datan lagras. README följer kursens mall: Kom igång, Arkitektur, Teknisk stack, Begränsningar och Utvecklat med. Håll den aktuell när funktioner läggs till.

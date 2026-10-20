# CLAUDE.md – Mumsa

> Arbetsnamn. Appen är inspirerad av Lifesum men har eget namn, egen design och ingen koppling till Lifesums varumärke eller kod.

## Vad projektet gör

Mumsa är en webbapp för att logga vad man äter och följa sitt kalori- och makrointag. Man sätter ett dagligt mål, söker eller skannar livsmedel, loggar dem per måltid och ser hur dagen och veckan ligger till mot målet. Appen går att installera på mobilen som PWA och fungerar offline.

## Problemet det löser

De stora kostappar som finns är låsta bakom abonnemang, kräver konto och samlar in hälsodata. Många vill bara ha en enkel, gratis logg där datan stannar på den egna enheten. Mumsa är till för vem som helst som vill hålla koll på vad hen äter utan konto, reklam eller betalvägg.

## Funktioner i MVP

1. Profil och mål: kalorimål och fördelning av protein, kolhydrater och fett (manuellt eller beräknat från vikt, längd, ålder och aktivitetsnivå).
2. Sök livsmedel via Open Food Facts och logga mängd i gram eller portioner, uppdelat på frukost, lunch, middag och mellanmål.
3. Streckkodsskanning med mobilens kamera.
4. Egna livsmedel för det som saknas eller är fel i databasen.
5. Dagsvy med intag mot mål och veckovy med enkel graf.
6. Export och import av all data som JSON, så att användaren kan flytta eller säkerhetskopiera den.

Utanför scope: konton, synk mellan enheter, kostplaner, recept, AI-funktioner, Apple Health och Google Fit.

## Teknikstack och varför

- **TypeScript + React + Vite**: väletablerat, snabb utvecklingsmiljö och bygger till statiska filer som kan ligga på GitHub Pages.
- **vite-plugin-pwa**: installerbar app och offlinestöd via service worker.
- **IndexedDB via Dexie**: all användardata lagras lokalt i webbläsaren. Ingen backend att drifta.
- **Open Food Facts API**: öppen och gratis livsmedelsdatabas med bra täckning av svenska produkter.
- **BarcodeDetector-API:t** med **@zxing/browser** som reserv för webbläsare som saknar det (till exempel Safari).
- **Vitest** och **Testing Library** för tester, **Playwright** för några end-to-end-flöden.
- **GitHub Actions** bygger, testar och deployar till GitHub Pages vid push till `main`.

## Arkitekturprinciper

- **Tre lager**:
  - `src/domain/` innehåller rena funktioner och typer: näringsberäkningar, summering per dag, målberäkning. Ingen React, ingen I/O.
  - `src/data/` är det enda lagret som pratar med omvärlden: IndexedDB, Open Food Facts och kameran. Exponerar enkla funktioner som returnerar domäntyper.
  - `src/ui/` innehåller React-komponenter och hooks. Komponenter anropar `data/` via hooks och räknar aldrig näringsvärden själva.
- Data från Open Food Facts mappas till egna domäntyper direkt i `data/`. Resten av appen känner inte till API:ts format.
- Näringsvärden lagras per 100 g och räknas om vid visning. Avrundning sker bara i UI:t.
- Inga globala variabler. Delad state hålls i React context eller i databasen, inte i moduler.
- Funktioner och komponenter gör en sak. En komponent som växer över cirka 150 rader delas upp.
- Allt i `domain/` har enhetstester.
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

## Definition av klart

Appen är publicerad på GitHub Pages, går att installera på iPhone och Android, klarar MVP-funktionerna ovan och har en README med skärmdumpar och förklaring av hur datan lagras.

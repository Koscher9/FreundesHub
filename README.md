# FreundesHub

FreundesHub ist eine moderne, private Partyspiel-Plattform für Freunde. Die erste vollständig spielbare Erfahrung ist der Activity-Modus im klassischen Teamformat. Das Projekt ist bewusst so modular aufgebaut, dass spätere Minispiele wie Quiz, Meme-Generator oder Zeichnen als eigene Module ergänzt werden können.

## Tech-Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- Appwrite-ready service layer
- lokale Demo-Umgebung ohne Backend-Anbindung

## Verfügbare Funktionen

- Team- und Raumkonfiguration
- Activity mit Erklären, Pantomime und Zeichnen
- Kategorien und Schwierigkeitsstufen
- eigene Begriffe verwalten
- Timer, Rundensteuerung und Punktestand
- Ergebnisübersicht und Siegerermittlung
- lokaler Entwicklungsmodus ohne falsche Appwrite-Daten

## Voraussetzungen

- Node.js 20+
- npm 10+
- Git

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Danach öffnest du im Browser die Adresse: http://localhost:3000

## Appwrite vorbereiten

1. Appwrite-Projekt anlegen
2. `.env.local` erstellen, basierend auf `.env.example`
3. Projekt- und Datenbank-IDs eintragen
4. passende Sammlungen für Räume, Spiele und Begriffe anlegen
5. Berechtigungen und Validierungen im Appwrite-Projekt festlegen

**Wichtig:** Keine API-Secrets oder Admin-Schlüssel in das Frontend einbauen. Das Projekt bleibt im lokalen Modus nutzbar, solange keine gültigen Appwrite-Variablen gesetzt sind.

## Projektstruktur

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  freundeshub-app.tsx
lib/
  appwrite.ts
  game/
    activity.ts
    registry.ts
```

## Qualitätsprüfungen

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Wichtige Hinweise

- Der lokale Modus ist als sichere Fallback-Implementierung gedacht.
- Appwrite wird als optionales Backend vorbereitet, aber nicht als notwendige Laufzeit vorausgesetzt.
- Die Spiel- und Punkte-Logik ist bewusst getrennt und für spätere Erweiterungen vorbereitet.

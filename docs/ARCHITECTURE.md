# Architektur von FreundesHub

## Überblick

FreundesHub ist als modulare Partyspiel-Plattform aufgebaut. Der Kern leitet Raum- und Spielzustand, UI und gemeinsame Spielmechaniken. Jedes eigene Minispiel wird als eigenes Modul registriert und über eine zentrale Spiel-Registrierung geladen.

## Kernprinzipien

- Trennung von Plattform-Kern und Spielmodulen
- Strikte Typisierung mit TypeScript
- Lokaler Entwicklungsmodus ohne Appwrite-Konfiguration
- Appwrite als optionales Backend für Räume, Spieler und Realtime-Updates
- Einfache Erweiterbarkeit für spätere Spiele wie Make It Meme oder Quiz

## Verzeichnisstruktur

```text
app/
  globals.css                # globale Styles und Tailwind-Setup
  layout.tsx                 # Root-Layout und Metadaten
  page.tsx                   # Einstiegspunkt der Web-App
components/
  freundeshub-app.tsx        # Haupt-UI und lokale Game-Logik
lib/
  appwrite.ts                # Appwrite-Config und lokale Fallback-Logik
  game/
    activity.ts              # Typen, Standardbegriffe und zentrale Spielregeln
    registry.ts              # zentrale Spielregistrierung
```

## Spielmodul-Design

### 1. Plattform-Kern

- Startseite mit Spielauswahl
- Raum- und Host-Konfiguration
- Teamverwaltung
- Live-Punktestand
- allgemeine Status- und Fehlermeldungen

### 2. Spielsystem

- zentrale Spielregistrierung in `lib/game/registry.ts`
- modulare Typen und Regeln pro Spiel
- gemeinsame Schnittstellen für `setup`, `playing` und `results`

### 3. Activity-Modul

Das aktuelle Activity-Modul kümmert sich um:

- Teamnamen und Spielkonfiguration
- Auswahl von Kategorien und Schwierigkeitsgraden
- lokale Begriffsauswahl
- Timer, Rundenwechsel und Ergebnisberechnung
- Punkte und gemeinsame Ergebnisübersicht

## Appwrite-Integration

Die Appwrite-Integration liegt in einer klaren Service-Schicht in `lib/appwrite.ts` und ist bewusst entkoppelt von der Spiellogik. Wenn keine Umgebungsvariablen gesetzt sind, verwendet die App automatisch den lokalen Entwicklungsmodus und zeigt entsprechende Hinweise an.

Erforderliche Variablen:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_APPWRITE_ROOM_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_GAME_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_WORDS_COLLECTION_ID`

## Erweiterung einer neuen Spielidee

1. neues Spielmodul unter `lib/game/` anlegen
2. in `gameRegistry` eintragen
3. eigene UI-Komponenten und Regel-Logik erstellen
4. Spielzustand mit dem bestehenden Plattform-Kern verbinden
5. Appwrite- und lokale Datenmodelle passend erweitern

## Wichtige Entscheidungen

- Keine Geheimnisse im Frontend
- keine `NEXT_PUBLIC_`-Secrets
- keine fiktiven Appwrite-IDs verwenden
- lokale Demo-Workflows sollen immer nutzbar bleiben
- zentrale Logik wird testbar gehalten

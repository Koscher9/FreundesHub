"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAppwriteConfigured, localModeBanner } from "@/lib/appwrite";
import {
  availableCategories,
  availableDifficulties,
  buildAvailableWords,
  buildInitialTeams,
  computeWinner,
  pickNextWord,
  type ActivityMode,
  type ActivityWord,
  type DifficultyLevel,
  type RoundResult,
  type Team,
  type WordCategory,
} from "@/lib/game/activity";
import { gameRegistry } from "@/lib/game/registry";

type GamePhase = "setup" | "playing" | "results";
type GameStatus = "idle" | "running" | "paused";

type ActivitySettings = {
  rounds: number;
  timeLimit: number;
  mode: ActivityMode;
  categories: WordCategory[];
  difficulties: DifficultyLevel[];
};

const defaultSettings: ActivitySettings = {
  rounds: 8,
  timeLimit: 45,
  mode: "Erklären",
  categories: [...availableCategories],
  difficulties: [...availableDifficulties],
};

const defaultCustomWords: ActivityWord[] = [
  {
    id: "custom-1",
    text: "Bergsteiger",
    category: "Alltag",
    difficulty: "mittel",
    source: "custom",
  },
  {
    id: "custom-2",
    text: "Würstchen Stand",
    category: "Situationen",
    difficulty: "leicht",
    source: "custom",
  },
];

function createDefaultTeams(): Team[] {
  return buildInitialTeams(["Team Alpha", "Team Beta", "Team Gamma"]);
}

export default function FriendsHubApp() {
  const [selectedGame, setSelectedGame] = useState("activity");
  const [roomCode, setRoomCode] = useState("FREUND");
  const [hostName, setHostName] = useState("Host");
  const [teams, setTeams] = useState<Team[]>(() => createDefaultTeams());
  const [settings, setSettings] = useState<ActivitySettings>(defaultSettings);
  const [customWords, setCustomWords] = useState<ActivityWord[]>(defaultCustomWords);
  const [customWordInput, setCustomWordInput] = useState("");
  const [customCategory, setCustomCategory] = useState<WordCategory>("Alltag");
  const [customDifficulty, setCustomDifficulty] = useState<DifficultyLevel>("leicht");
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<ActivityWord | null>(null);
  const [usedWordIds, setUsedWordIds] = useState<string[]>([]);
  const [timer, setTimer] = useState(defaultSettings.timeLimit);
  const [turnsPlayed, setTurnsPlayed] = useState(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [lastAction, setLastAction] = useState("Bereit zum Start");

  const availableWords = useMemo(
    () => buildAvailableWords(customWords, settings.categories, settings.difficulties),
    [customWords, settings.categories, settings.difficulties],
  );
  const currentTeam = teams[currentTeamIndex] ?? teams[0];
  const winner = useMemo(() => computeWinner(teams), [teams]);
  const localModeActive = !isAppwriteConfigured();

  const updateTeamName = (index: number, value: string) => {
    setTeams((previousTeams) =>
      previousTeams.map((team, teamIndex) =>
        teamIndex === index ? { ...team, name: value.trim() || `Team ${index + 1}` } : team,
      ),
    );
  };

  const toggleCategory = (category: WordCategory) => {
    setSettings((previous) => {
      const exists = previous.categories.includes(category);
      const categories = exists
        ? previous.categories.filter((item) => item !== category)
        : [...previous.categories, category];

      return {
        ...previous,
        categories: categories.length > 0 ? categories : previous.categories,
      };
    });
  };

  const toggleDifficulty = (difficulty: DifficultyLevel) => {
    setSettings((previous) => {
      const exists = previous.difficulties.includes(difficulty);
      const difficulties = exists
        ? previous.difficulties.filter((item) => item !== difficulty)
        : [...previous.difficulties, difficulty];

      return {
        ...previous,
        difficulties: difficulties.length > 0 ? difficulties : previous.difficulties,
      };
    });
  };

  const addCustomWord = () => {
    const trimmed = customWordInput.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.replace(/\s+/g, " ");
    const duplicate = [...customWords].some(
      (word) => word.text.toLowerCase() === normalized.toLowerCase(),
    );

    if (duplicate) {
      setLastAction("Dieser Begriff wurde bereits hinzugefügt.");
      return;
    }

    const newWord: ActivityWord = {
      id: `custom-${Date.now()}`,
      text: normalized,
      category: customCategory,
      difficulty: customDifficulty,
      source: "custom",
    };

    setCustomWords((previous) => [...previous, newWord]);
    setCustomWordInput("");
    setLastAction(`Begriff hinzugefügt: ${normalized}`);
  };

  const removeCustomWord = (wordId: string) => {
    setCustomWords((previous) => previous.filter((word) => word.id !== wordId));
  };

  const startGame = () => {
    if (teams.length < 2) {
      setLastAction("Mindestens zwei Teams sind nötig.");
      return;
    }

    const firstWord = pickNextWord(availableWords, []);
    if (!firstWord) {
      setLastAction("Keine passenden Begriffe gefunden. Passe Kategorien oder Schwierigkeitsstufen an.");
      return;
    }

    setTurnsPlayed(0);
    setHistory([]);
    setCurrentTeamIndex(0);
    setCurrentWord(firstWord);
    setUsedWordIds([firstWord.id]);
    setTimer(settings.timeLimit);
    setStatus("running");
    setGamePhase("playing");
    setLastAction(`${teams[0]?.name ?? "Team 1"} beginnt mit dem ersten Begriff.`);
  };

  const resetGame = () => {
    setGamePhase("setup");
    setStatus("idle");
    setCurrentWord(null);
    setUsedWordIds([]);
    setTurnsPlayed(0);
    setHistory([]);
    setTimer(settings.timeLimit);
    setLastAction("Zurückgesetzt und bereit für neue Runde.");
  };

  const resolveTurn = useCallback(
    (result: "correct" | "skip" | "timeout") => {
      if (!currentWord || gamePhase !== "playing") {
        return;
      }

      const activeTeam = teams[currentTeamIndex];
      if (!activeTeam) {
        return;
      }

      const points = result === "correct" ? Math.max(10, timer) : 0;
      const roundNumber = turnsPlayed + 1;

      setTeams((previousTeams) =>
        previousTeams.map((team, index) =>
          index === currentTeamIndex ? { ...team, score: team.score + points } : team,
        ),
      );

      const roundLog: RoundResult = {
        teamId: activeTeam.id,
        teamName: activeTeam.name,
        round: roundNumber,
        word: currentWord.text,
        result,
        points,
      };

      setHistory((previousHistory) => [roundLog, ...previousHistory]);
      setTurnsPlayed(roundNumber);

      if (roundNumber >= settings.rounds) {
        setGamePhase("results");
        setStatus("idle");
        setCurrentWord(null);
        setLastAction("Partie beendet. Ergebnisbildschirm aktiv.");
        return;
      }

      const nextIndex = (currentTeamIndex + 1) % teams.length;
      const nextWord = pickNextWord(availableWords, usedWordIds);

      if (!nextWord) {
        setGamePhase("results");
        setStatus("idle");
        setCurrentWord(null);
        setLastAction("Keine Begriffe mehr verfügbar. Ergebnisbildschirm aktiv.");
        return;
      }

      setCurrentTeamIndex(nextIndex);
      setCurrentWord(nextWord);
      setUsedWordIds([...usedWordIds, nextWord.id]);
      setTimer(settings.timeLimit);
      setStatus("running");
      setLastAction(`${teams[nextIndex]?.name ?? "Nächstes Team"} übernimmt jetzt.`);
    },
    [availableWords, currentTeamIndex, currentWord, gamePhase, settings.rounds, settings.timeLimit, teams, timer, usedWordIds, turnsPlayed],
  );

  useEffect(() => {
    if (gamePhase !== "playing" || status !== "running") {
      return undefined;
    }

    if (timer <= 0) {
      const timeoutId = window.setTimeout(() => {
        resolveTurn("timeout");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutHandle = window.setTimeout(() => {
      setTimer((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutHandle);
  }, [gamePhase, resolveTurn, status, timer]);

  const summaryText =
    winner.winnerNames.length > 1
      ? `${winner.winnerNames.join(" und ")} teilen sich den Sieg mit ${winner.winnerScore} Punkten.`
      : `${winner.winnerNames[0] ?? "Team 1"} gewinnt mit ${winner.winnerScore} Punkten.`;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-violet-300">FreundesHub</p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Modulare Partyspiel-Plattform</h1>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="rounded-full border border-violet-500/60 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              {localModeActive ? "Lokaler Modus" : "Appwrite aktiviert"}
            </span>
            <span className="text-sm text-zinc-400">Raum {roomCode}</span>
          </div>
        </header>

        {localModeActive ? (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {localModeBanner}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Spielauswahl</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Spiele</h2>
                </div>
                <div className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200">
                  {gameRegistry.length} Module
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {gameRegistry.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGame(game.id)}
                    disabled={game.status !== "available"}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedGame === game.id && game.status === "available"
                        ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-900/40"
                        : "border-zinc-700 bg-zinc-950/50 hover:border-zinc-500"
                    } ${game.status !== "available" ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-white">{game.name}</span>
                      <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                        {game.status === "available" ? "Live" : "Soon"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{game.shortDescription}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedGame === "activity" ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Activity</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Spielvorbereitung</h2>
                  </div>
                  <div className="rounded-full border border-emerald-600/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {gamePhase === "setup" ? "Vorbereitung" : gamePhase === "playing" ? "Laufend" : "Ergebnisse"}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <label className="block text-sm text-zinc-300">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-400">Raumcode</span>
                      <input
                        value={roomCode}
                        onChange={(event) => setRoomCode(event.target.value.toUpperCase().slice(0, 8))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-violet-500"
                      />
                    </label>

                    <label className="block text-sm text-zinc-300">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-400">Host</span>
                      <input
                        value={hostName}
                        onChange={(event) => setHostName(event.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-violet-500"
                      />
                    </label>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Teams</p>
                      {teams.map((team, index) => (
                        <div key={team.id} className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 p-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-200">
                            {index + 1}
                          </span>
                          <input
                            value={team.name}
                            onChange={(event) => updateTeamName(index, event.target.value)}
                            className="w-full bg-transparent text-white outline-none"
                            aria-label={`Team ${index + 1} Name`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm text-zinc-300">
                        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-400">Runden</span>
                        <input
                          type="number"
                          min={2}
                          max={30}
                          value={settings.rounds}
                          onChange={(event) =>
                            setSettings((previous) => ({
                              ...previous,
                              rounds: Math.max(2, Number(event.target.value) || 2),
                            }))
                          }
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-violet-500"
                        />
                      </label>

                      <label className="block text-sm text-zinc-300">
                        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-400">Zeitlimit</span>
                        <input
                          type="number"
                          min={15}
                          max={120}
                          value={settings.timeLimit}
                          onChange={(event) => {
                            const nextValue = Math.max(15, Number(event.target.value) || 15);
                            setSettings((previous) => ({ ...previous, timeLimit: nextValue }));
                            setTimer(nextValue);
                          }}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-violet-500"
                        />
                      </label>
                    </div>

                    <label className="block text-sm text-zinc-300">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-400">Spielart</span>
                      <select
                        value={settings.mode}
                        onChange={(event) =>
                          setSettings((previous) => ({
                            ...previous,
                            mode: event.target.value as ActivityMode,
                          }))
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-violet-500"
                      >
                        <option value="Erklären">Erklären</option>
                        <option value="Pantomime">Pantomime</option>
                        <option value="Zeichnen">Zeichnen</option>
                      </select>
                    </label>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Kategorien</p>
                      <div className="flex flex-wrap gap-2">
                        {availableCategories.map((category) => {
                          const selected = settings.categories.includes(category);
                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                selected
                                  ? "border-violet-500 bg-violet-500/15 text-violet-100"
                                  : "border-zinc-700 bg-zinc-950 text-zinc-300"
                              }`}
                            >
                              {category}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Schwierigkeit</p>
                      <div className="flex flex-wrap gap-2">
                        {availableDifficulties.map((difficulty) => {
                          const selected = settings.difficulties.includes(difficulty);
                          return (
                            <button
                              key={difficulty}
                              type="button"
                              onClick={() => toggleDifficulty(difficulty)}
                              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                selected
                                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-100"
                                  : "border-zinc-700 bg-zinc-950 text-zinc-300"
                              }`}
                            >
                              {difficulty}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">Eigene Begriffe</h3>
                    <span className="text-xs text-zinc-400">{customWords.length} im Pool</span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr,130px,110px,auto]">
                    <input
                      value={customWordInput}
                      onChange={(event) => setCustomWordInput(event.target.value)}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
                      placeholder="Neuen Begriff eingeben"
                    />

                    <select
                      value={customCategory}
                      onChange={(event) => setCustomCategory(event.target.value as WordCategory)}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
                    >
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <select
                      value={customDifficulty}
                      onChange={(event) => setCustomDifficulty(event.target.value as DifficultyLevel)}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
                    >
                      {availableDifficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={addCustomWord}
                      className="rounded-xl bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500"
                    >
                      Hinzufügen
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {customWords.length === 0 ? (
                      <span className="text-sm text-zinc-500">Noch keine eigenen Begriffe.</span>
                    ) : (
                      customWords.map((word) => (
                        <button
                          key={word.id}
                          type="button"
                          onClick={() => removeCustomWord(word.id)}
                          title="Begriff löschen"
                          className="rounded-full border border-rose-500/50 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100 transition hover:border-rose-400"
                        >
                          {word.text} ×
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startGame}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Spiel starten
                  </button>
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>
            ) : null}

            {gamePhase === "playing" ? (
              <div className="rounded-3xl border border-violet-500/40 bg-violet-500/5 p-5 shadow-lg shadow-violet-900/20">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Aktive Runde</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {currentTeam?.name ?? "Team"} spielt gerade
                    </h2>
                  </div>
                  <div className="rounded-full border border-violet-500 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-100">
                    {turnsPlayed + 1}/{settings.rounds}
                  </div>
                </div>

                <div className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Begriff</p>
                  <div className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {currentWord?.text ?? "—"}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3 text-sm text-zinc-300">
                    <span className="rounded-full border border-zinc-700 px-3 py-1">{settings.mode}</span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1">{currentWord?.category ?? "—"}</span>
                    <span className="rounded-full border border-zinc-700 px-3 py-1">{currentWord?.difficulty ?? "—"}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr,auto] sm:items-center">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="flex items-center justify-between text-sm text-zinc-300">
                      <span>Countdown</span>
                      <span className="font-semibold text-white">{timer}s</span>
                    </div>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                        style={{ width: `${(timer / settings.timeLimit) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStatus((previous) => (previous === "running" ? "paused" : "running"))}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
                  >
                    {status === "running" ? "Pausieren" : "Fortsetzen"}
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => resolveTurn("correct")}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Richtig geraten
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveTurn("skip")}
                    className="rounded-xl border border-amber-500 bg-amber-500/10 px-5 py-3 font-semibold text-amber-100 transition hover:bg-amber-500/15"
                  >
                    Überspringen
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveTurn("timeout")}
                    className="rounded-xl border border-rose-500 bg-rose-500/10 px-5 py-3 font-semibold text-rose-100 transition hover:bg-rose-500/15"
                  >
                    Zeit abgelaufen
                  </button>
                </div>
              </div>
            ) : null}

            {gamePhase === "results" ? (
              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-5 shadow-lg shadow-emerald-900/20">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Ergebnis</p>
                <h2 className="mt-3 text-3xl font-bold text-white">{summaryText}</h2>

                <div className="mt-5 space-y-3">
                  {teams
                    .slice()
                    .sort((left, right) => right.score - left.score)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-sm font-medium text-violet-200">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-white">{team.name}</span>
                        </div>
                        <span className="text-lg font-bold text-emerald-300">{team.score} P</span>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startGame}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Neue Partie starten
                  </button>
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 font-semibold text-zinc-200 transition hover:border-zinc-500"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Live-Status</p>
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm text-zinc-300">Aktuelle Meldung</p>
                <p className="mt-2 text-base font-medium text-white">{lastAction}</p>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-zinc-400">Status</span>
                  <span className="font-medium text-white">
                    {status === "running" ? "Läuft" : status === "paused" ? "Pausiert" : "Bereit"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-zinc-400">Verfügbare Begriffe</span>
                  <span className="font-medium text-white">{availableWords.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-zinc-400">Runden</span>
                  <span className="font-medium text-white">{turnsPlayed}/{settings.rounds}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Punktestand</p>
              <div className="mt-4 space-y-3">
                {teams.map((team) => (
                  <div key={team.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{team.name}</span>
                      <span className="text-lg font-bold text-emerald-300">{team.score}</span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-400">
                      {team.players.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Rundenverlauf</p>
              <div className="mt-4 space-y-3">
                {history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 p-3 text-sm text-zinc-500">
                    Noch keine Ergebnisse dokumentiert.
                  </div>
                ) : (
                  history.slice(0, 5).map((entry) => (
                    <div key={`${entry.teamId}-${entry.round}-${entry.word}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-white">{entry.teamName}</span>
                        <span className="text-emerald-300">+{entry.points} P</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300">{entry.word}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">
                        {entry.result === "correct" ? "Richtig" : entry.result === "skip" ? "Übersprungen" : "Zeit abgelaufen"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

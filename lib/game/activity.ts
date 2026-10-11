export type ActivityMode = "Erklären" | "Pantomime" | "Zeichnen";
export type DifficultyLevel = "leicht" | "mittel" | "schwer";
export type WordCategory =
  | "Alltag"
  | "Berufe"
  | "Tiere"
  | "Gegenstände"
  | "Situationen"
  | "Lustige Begriffe";

export interface ActivityWord {
  id: string;
  text: string;
  category: WordCategory;
  difficulty: DifficultyLevel;
  source: "builtin" | "custom";
}

export interface Team {
  id: string;
  name: string;
  score: number;
  players: string[];
}

export interface RoundResult {
  teamId: string;
  teamName: string;
  round: number;
  word: string;
  result: "correct" | "skip" | "timeout";
  points: number;
}

export const availableCategories: WordCategory[] = [
  "Alltag",
  "Berufe",
  "Tiere",
  "Gegenstände",
  "Situationen",
  "Lustige Begriffe",
];

export const availableDifficulties: DifficultyLevel[] = ["leicht", "mittel", "schwer"];

export const builtinWords: ActivityWord[] = [
  { id: "built-01", text: "Kaffeetasse", category: "Alltag", difficulty: "leicht", source: "builtin" },
  { id: "built-02", text: "Laufband", category: "Alltag", difficulty: "mittel", source: "builtin" },
  { id: "built-03", text: "Kaugummi", category: "Alltag", difficulty: "leicht", source: "builtin" },
  { id: "built-04", text: "Büroklima", category: "Berufe", difficulty: "mittel", source: "builtin" },
  { id: "built-05", text: "Pilot", category: "Berufe", difficulty: "leicht", source: "builtin" },
  { id: "built-06", text: "Friseur", category: "Berufe", difficulty: "mittel", source: "builtin" },
  { id: "built-07", text: "Krokodil", category: "Tiere", difficulty: "leicht", source: "builtin" },
  { id: "built-08", text: "Pinguin", category: "Tiere", difficulty: "mittel", source: "builtin" },
  { id: "built-09", text: "Nashorn", category: "Tiere", difficulty: "schwer", source: "builtin" },
  { id: "built-10", text: "USB-Stick", category: "Gegenstände", difficulty: "leicht", source: "builtin" },
  { id: "built-11", text: "Wäschespinne", category: "Gegenstände", difficulty: "schwer", source: "builtin" },
  { id: "built-12", text: "Sonnencreme", category: "Gegenstände", difficulty: "mittel", source: "builtin" },
  { id: "built-13", text: "Schnellrestaurant", category: "Situationen", difficulty: "leicht", source: "builtin" },
  { id: "built-14", text: "Büroflurfight", category: "Situationen", difficulty: "schwer", source: "builtin" },
  { id: "built-15", text: "Stromausfall", category: "Situationen", difficulty: "mittel", source: "builtin" },
  { id: "built-16", text: "Bauchschmerzen", category: "Lustige Begriffe", difficulty: "leicht", source: "builtin" },
  { id: "built-17", text: "Toilettenchaos", category: "Lustige Begriffe", difficulty: "mittel", source: "builtin" },
  { id: "built-18", text: "Wackelgulasch", category: "Lustige Begriffe", difficulty: "schwer", source: "builtin" },
];

export function buildAvailableWords(
  customWords: ActivityWord[] = [],
  categories: WordCategory[] = availableCategories,
  difficulties: DifficultyLevel[] = availableDifficulties,
): ActivityWord[] {
  const categorySet = new Set(categories);
  const difficultySet = new Set(difficulties);

  const builtInMatches = builtinWords.filter(
    (word) => categorySet.has(word.category) && difficultySet.has(word.difficulty),
  );

  const customMatches = customWords.filter(
    (word) => categorySet.has(word.category) && difficultySet.has(word.difficulty),
  );

  return [...builtInMatches, ...customMatches].sort((left, right) =>
    left.text.localeCompare(right.text),
  );
}

export function pickNextWord(
  words: ActivityWord[],
  usedIds: string[] = [],
): ActivityWord | null {
  const available = words.filter((word) => !usedIds.includes(word.id));
  if (available.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * available.length);
  return available[index] ?? null;
}

export function applyTeamResult(
  team: Team,
  result: "correct" | "skip" | "timeout",
  secondsLeft: number,
): Team {
  if (result !== "correct") {
    return team;
  }

  const points = Math.max(10, secondsLeft);
  return {
    ...team,
    score: team.score + points,
  };
}

export function buildInitialTeams(teamNames: string[]): Team[] {
  return teamNames.map((name, index) => ({
    id: `team-${index + 1}`,
    name: name.trim() || `Team ${index + 1}`,
    score: 0,
    players: [
      `${name.trim() || `Team ${index + 1}`} Player 1`,
      `${name.trim() || `Team ${index + 1}`} Player 2`,
    ],
  }));
}

export function computeWinner(teams: Team[]) {
  const highestScore = Math.max(...teams.map((team) => team.score), 0);
  const winners = teams.filter((team) => team.score === highestScore);

  return {
    winnerScore: highestScore,
    winnerNames: winners.map((team) => team.name),
    winners,
  };
}

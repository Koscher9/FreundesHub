export type GameDescriptor = {
  id: string;
  name: string;
  shortDescription: string;
  status: "available" | "coming-soon";
  mode: "team" | "classic";
};

export const gameRegistry: GameDescriptor[] = [
  {
    id: "activity",
    name: "Activity",
    shortDescription: "Teammodus mit Erklären, Pantomime und Zeichnen.",
    status: "available",
    mode: "team",
  },
  {
    id: "make-it-meme",
    name: "Make It Meme",
    shortDescription: "Bilder und kreative Bildunterschriften im Team.",
    status: "coming-soon",
    mode: "team",
  },
  {
    id: "party-quiz",
    name: "Party-Quiz",
    shortDescription: "Eigene Fragen, Kategorien und schnelle Runden.",
    status: "coming-soon",
    mode: "classic",
  },
];

import { describe, expect, it, vi } from "vitest";
import {
  applyTeamResult,
  buildAvailableWords,
  computeWinner,
  pickNextWord,
  type Team,
} from "./activity";

describe("Activity game logic", () => {
  it("does not repeat a word until all available words are used", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.2);
    const words = buildAvailableWords([], ["Alltag"], ["leicht"]);
    const first = pickNextWord(words, []);
    const second = pickNextWord(words, first ? [first.id] : []);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second?.id).not.toBe(first?.id);

    randomSpy.mockRestore();
  });

  it("awards points for a correct answer according to the remaining time", () => {
    const team: Team = { id: "team-a", name: "Team A", score: 20, players: ["Anna", "Boris"] };

    const updated = applyTeamResult(team, "correct", 18);

    expect(updated.score).toBe(38);
  });

  it("detects a tie and returns both winners", () => {
    const teams: Team[] = [
      { id: "team-a", name: "Team A", score: 50, players: ["Anna"] },
      { id: "team-b", name: "Team B", score: 50, players: ["Boris"] },
      { id: "team-c", name: "Team C", score: 30, players: ["Carla"] },
    ];

    const result = computeWinner(teams);

    expect(result.winnerScore).toBe(50);
    expect(result.winnerNames).toEqual(["Team A", "Team B"]);
  });
});

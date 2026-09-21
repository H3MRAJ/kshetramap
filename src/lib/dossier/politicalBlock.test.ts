import { describe, expect, it } from "vitest";
import { summarizeBoothStrength, type BoothStrengthInput } from "./politicalBlock";

const FOCUS = "anant_kumar_singh";

function booth(pct: number, won: boolean, totalValid = 400): BoothStrengthInput {
  return {
    pct: { [FOCUS]: pct },
    winner_key: won ? FOCUS : "someone_else",
    total_valid: totalValid,
  };
}

describe("summarizeBoothStrength", () => {
  it("tallies strong/average/weak/na tiers and preserves total_booths", () => {
    const booths: BoothStrengthInput[] = [
      booth(60, true), // strong (>=50 and won)
      booth(40, false), // weak (lost, <50)
      booth(45, true), // average (>=35 and <50, won)
      booth(10, false, 0), // na (no valid votes)
    ];

    const summary = summarizeBoothStrength(booths, FOCUS);

    expect(summary).toEqual({
      total_booths: 4,
      strong: 1,
      average: 1,
      weak: 1,
      na: 1,
    });
    expect(summary.strong + summary.average + summary.weak + summary.na).toBe(summary.total_booths);
  });

  it("treats a booth missing the focus key's pct entry as 0% share", () => {
    const booths: BoothStrengthInput[] = [{ pct: {}, winner_key: "other_candidate", total_valid: 300 }];

    const summary = summarizeBoothStrength(booths, FOCUS);

    expect(summary).toEqual({ total_booths: 1, strong: 0, average: 0, weak: 1, na: 0 });
  });

  it("returns all-zero counts for an empty booth list", () => {
    expect(summarizeBoothStrength([], FOCUS)).toEqual({
      total_booths: 0,
      strong: 0,
      average: 0,
      weak: 0,
      na: 0,
    });
  });
});

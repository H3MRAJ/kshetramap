import { describe, expect, it } from "vitest";
import { toFocusYearPoints } from "./focusYearAdapter";
import type { PoliticalBlockFocusYear } from "./politicalBlock";

describe("toFocusYearPoints", () => {
  it("maps year/votes/share/on_ballot straight through", () => {
    const series: PoliticalBlockFocusYear[] = [
      { year: 2015, votes: 1000, share: 40.5, on_ballot: true },
      { year: 2020, votes: 1200, share: 42.1, on_ballot: true },
      { year: 2025, votes: 1500, share: 45.2, on_ballot: true },
    ];

    const points = toFocusYearPoints(series);

    expect(points).toEqual([
      { year: 2015, votes: 1000, share: 40.5, on_ballot: true, total_valid: 0, electors_total: null, nota: 0 },
      { year: 2020, votes: 1200, share: 42.1, on_ballot: true, total_valid: 0, electors_total: null, nota: 0 },
      { year: 2025, votes: 1500, share: 45.2, on_ballot: true, total_valid: 0, electors_total: null, nota: 0 },
    ]);
  });

  it("fills the unused FocusYearPoint fields with the documented inert placeholders", () => {
    const series: PoliticalBlockFocusYear[] = [{ year: 2020, votes: 0, share: 0, on_ballot: false }];

    const [point] = toFocusYearPoints(series);

    expect(point.total_valid).toBe(0);
    expect(point.electors_total).toBeNull();
    expect(point.nota).toBe(0);
  });

  it("handles an empty series", () => {
    expect(toFocusYearPoints([])).toEqual([]);
  });

  it("preserves input order (does not re-sort)", () => {
    const series: PoliticalBlockFocusYear[] = [
      { year: 2025, votes: 1, share: 1, on_ballot: true },
      { year: 2015, votes: 2, share: 2, on_ballot: true },
    ];

    expect(toFocusYearPoints(series).map((p) => p.year)).toEqual([2025, 2015]);
  });
});

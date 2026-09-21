import { describe, expect, it } from "vitest";
import { normalizeIssues, type Issue } from "./normalizeIssues";

function issue(title: string, rank: number): Issue {
  return { title, title_hi: undefined, rank, note: undefined };
}

describe("normalizeIssues", () => {
  it("assigns rank = index + 1 for a freshly-built list (e.g. after adding an item)", () => {
    const items = [issue("Roads", 0), issue("Water", 0), issue("Irrigation", 0)];
    const normalized = normalizeIssues(items);
    expect(normalized.map((i) => i.rank)).toEqual([1, 2, 3]);
  });

  it("recomputes contiguous ranks after removing an item from the middle", () => {
    // Stale ranks 1, 2, 3 — remove the middle item, ranks must collapse to 1, 2.
    const items = [issue("Roads", 1), issue("Irrigation", 3)]; // "Water" (rank 2) removed
    const normalized = normalizeIssues(items);
    expect(normalized.map((i) => i.rank)).toEqual([1, 2]);
    expect(normalized.map((i) => i.title)).toEqual(["Roads", "Irrigation"]);
  });

  it("recomputes ranks to match new array position after a reorder", () => {
    // Simulates a drag-reorder: "Irrigation" (was last) moved to first.
    const items = [issue("Irrigation", 3), issue("Roads", 1), issue("Water", 2)];
    const normalized = normalizeIssues(items);
    expect(normalized.map((i) => `${i.title}:${i.rank}`)).toEqual([
      "Irrigation:1",
      "Roads:2",
      "Water:3",
    ]);
  });

  it("rank always matches 1-indexed array position regardless of stale input ranks", () => {
    const items = [issue("A", 99), issue("B", -1), issue("C", 0)];
    const normalized = normalizeIssues(items);
    normalized.forEach((item, index) => {
      expect(item.rank).toBe(index + 1);
    });
  });

  it("an empty list normalizes to an empty list, no throw", () => {
    expect(normalizeIssues([])).toEqual([]);
  });

  it("preserves every other field on each item, only overwriting rank", () => {
    const items: Issue[] = [{ title: "Roads", title_hi: "सड़कें", rank: 5, note: "Top concern" }];
    const normalized = normalizeIssues(items);
    expect(normalized[0]).toEqual({ title: "Roads", title_hi: "सड़कें", rank: 1, note: "Top concern" });
  });
});

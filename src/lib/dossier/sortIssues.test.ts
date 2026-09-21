import { describe, expect, it } from "vitest";
import { sortIssuesByRank, type Issue } from "./sortIssues";

function issue(title: string, rank: number): Issue {
  return { title, rank };
}

describe("sortIssuesByRank", () => {
  it("sorts ascending by rank", () => {
    const issues = [issue("C", 3), issue("A", 1), issue("B", 2)];
    expect(sortIssuesByRank(issues).map((i) => i.title)).toEqual(["A", "B", "C"]);
  });

  it("does not mutate the input array", () => {
    const issues = [issue("Second", 2), issue("First", 1)];
    const original = [...issues];
    sortIssuesByRank(issues);
    expect(issues).toEqual(original);
  });

  it("handles an already-sorted array without reordering", () => {
    const issues = [issue("First", 1), issue("Second", 2)];
    expect(sortIssuesByRank(issues).map((i) => i.title)).toEqual(["First", "Second"]);
  });

  it("handles an empty array", () => {
    expect(sortIssuesByRank([])).toEqual([]);
  });

  it("is stable-ish for out-of-order stored data, defensively re-sorting regardless of input order", () => {
    const issues = [issue("Fifth", 5), issue("First", 1), issue("Third", 3), issue("Second", 2), issue("Fourth", 4)];
    expect(sortIssuesByRank(issues).map((i) => i.title)).toEqual([
      "First",
      "Second",
      "Third",
      "Fourth",
      "Fifth",
    ]);
  });
});

import type { ProfileEconomic } from "@/lib/profile/profileRepo";

export type Issue = ProfileEconomic["issues"][number];

/**
 * Recomputes `rank = index + 1` for every item, so stale ranks never survive
 * an add/remove/reorder. Extracted as its own pure, dependency-free module
 * (rather than a private function inside `EconomicTab.tsx`) purely so it's
 * directly unit-testable — this file has no `"use client"`/JSX of its own,
 * so it can be imported straight from a plain `.test.ts` file, matching
 * this codebase's convention of not importing `.tsx` component files into
 * tests (see `vitest.config.ts`'s `include: ["src/**\/*.test.ts"]`).
 */
export function normalizeIssues(items: Issue[]): Issue[] {
  return items.map((item, index) => ({ ...item, rank: index + 1 }));
}

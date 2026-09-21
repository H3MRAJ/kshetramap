import type { ProfileEconomic } from "@/lib/profile/profileRepo";

export type Issue = ProfileEconomic["issues"][number];

/**
 * Sorts `economic.issues[]` by `rank` ascending. The profile editor
 * (B-Task 6) already maintains `rank` correctly on every list mutation, but
 * the dossier re-sorts defensively at render time rather than trusting
 * stored array order (task-8 brief). Pure and non-mutating — returns a new
 * array, never reorders the caller's own array in place.
 */
export function sortIssuesByRank(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => a.rank - b.rank);
}

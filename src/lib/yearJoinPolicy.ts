/**
 * Booth-level join policy for historical years.
 *
 * 2015: Form 20 has serials only (no PS building names). Serial join stays
 * "low" confidence — map still colours low joins but banners warn loudly.
 * History booth charts exclude 2015 until a 2015 PS-name list exists.
 *
 * Set ac_level_only true to force grey pins (no booth winners).
 */

export type BoothJoinMode = "booth" | "ac_level_only";

/** Map: show low-confidence 2015 colours (readable) with warnings. */
export const YEAR_BOOTH_JOIN: Record<number, BoothJoinMode> = {
  2015: "booth",
  2020: "booth",
  2025: "booth",
};

/** History booth-level charts: still demote 2015 until name crosswalk. */
export const YEAR_HISTORY_BOOTH_CHART: Record<number, boolean> = {
  2015: false, // do not chart 2015 as reliable booth series
  2020: true,
  2025: true,
};

export function boothJoinMode(year: number): BoothJoinMode {
  return YEAR_BOOTH_JOIN[year] ?? "booth";
}

export function isAcLevelOnlyYear(year: number): boolean {
  return boothJoinMode(year) === "ac_level_only";
}

export function historyBoothChartAllowed(year: number): boolean {
  return YEAR_HISTORY_BOOTH_CHART[year] !== false;
}

/** User-facing banner only — no paths, scripts, or internal join jargon. */
export function yearJoinBanner(year: number): string | null {
  if (year === 2015) {
    return "2015 booth colours are approximate. Prefer History for constituency totals. Grey pins have no reliable match.";
  }
  if (year === 2020) {
    return "2020 booth colours are approximate where booths were split or renumbered. Grey pins have no reliable match.";
  }
  return null;
}

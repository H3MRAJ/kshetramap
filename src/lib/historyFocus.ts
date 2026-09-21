import type {
  BoothMatches,
  ElectionPackage,
  HistoryCandidate,
  PlaceSeriesEntry,
  PlaceYearStats,
} from "./historyTypes";
import { mergeBoothRows } from "./boothMatch";

export type FocusOption = {
  key: string;
  name: string;
  color: string;
  /** Years this person appears on Form 20 */
  years: number[];
  /** Max EVM votes in any year (for sort) */
  maxVotes: number;
};

/** Union of candidates across election packages, sorted by peak votes. */
export function buildFocusOptions(
  elections: Record<number, ElectionPackage>
): FocusOption[] {
  const map = new Map<string, FocusOption>();
  for (const [ys, pkg] of Object.entries(elections)) {
    const year = Number(ys);
    for (const c of pkg.candidates) {
      const prev = map.get(c.key);
      if (!prev) {
        map.set(c.key, {
          key: c.key,
          name: c.name,
          color: c.color,
          years: [year],
          maxVotes: c.evm_votes,
        });
      } else {
        if (!prev.years.includes(year)) prev.years.push(year);
        prev.years.sort();
        if (c.evm_votes > prev.maxVotes) prev.maxVotes = c.evm_votes;
        // prefer longer display name / keep color from highest-vote year
        if (c.evm_votes >= prev.maxVotes) {
          prev.name = c.name;
          prev.color = c.color;
        }
      }
    }
  }
  return [...map.values()].sort(
    (a, b) => b.maxVotes - a.maxVotes || a.name.localeCompare(b.name)
  );
}

export function candidateVotes(
  pkg: ElectionPackage | undefined,
  key: string
): number {
  if (!pkg) return 0;
  return pkg.totals.candidates[key] ?? 0;
}

export function candidateShare(
  pkg: ElectionPackage | undefined,
  key: string
): number {
  if (!pkg || !pkg.totals.total_valid) return 0;
  return (
    Math.round(
      ((100 * (pkg.totals.candidates[key] ?? 0)) / pkg.totals.total_valid) * 100
    ) / 100
  );
}

export function onBallot(
  pkg: ElectionPackage | undefined,
  key: string
): boolean {
  return !!pkg?.candidates.some((c) => c.key === key);
}

export function findCandidate(
  elections: Record<number, ElectionPackage>,
  key: string
): HistoryCandidate | null {
  for (const y of Object.keys(elections)
    .map(Number)
    .sort((a, b) => b - a)) {
    const c = elections[y]?.candidates.find((x) => x.key === key);
    if (c) return c;
  }
  return null;
}

export type FocusYearPoint = {
  year: number;
  votes: number;
  share: number;
  total_valid: number;
  on_ballot: boolean;
  electors_total: number | null;
  nota: number;
};

export function focusYearSeries(
  elections: Record<number, ElectionPackage>,
  focusKey: string
): FocusYearPoint[] {
  return Object.values(elections)
    .sort((a, b) => a.year - b.year)
    .map((pkg) => ({
      year: pkg.year,
      votes: candidateVotes(pkg, focusKey),
      share: candidateShare(pkg, focusKey),
      total_valid: pkg.totals.total_valid,
      on_ballot: onBallot(pkg, focusKey),
      electors_total: pkg.electors_total,
      nota: pkg.totals.nota,
    }));
}

function placeYearStats(
  year: number,
  boothNos: number[],
  matches: BoothMatches,
  elections: Record<number, ElectionPackage>,
  focusKey: string
): PlaceYearStats {
  const pkg = elections[year];
  let total_valid = 0;
  let focus_votes = 0;
  let matched = 0;
  if (!pkg) {
    return {
      year,
      total_valid: 0,
      focus_votes: 0,
      focus_share_pct: 0,
      booth_count: boothNos.length,
      matched_booth_count: 0,
    };
  }
  const matchByNo = new Map(
    matches.matches.map((m) => [m.booth_no_2025, m] as const)
  );
  for (const no of boothNos) {
    const m = matchByNo.get(no);
    const ym = m?.by_year[String(year)];
    if (!ym || ym.confidence === "unmatched" || !ym.keys?.length) continue;
    const row = mergeBoothRows(pkg, ym.keys);
    if (!row) continue;
    matched += 1;
    total_valid += row.total_valid;
    focus_votes += row.votes[focusKey] ?? 0;
  }
  return {
    year,
    total_valid,
    focus_votes,
    focus_share_pct:
      total_valid > 0
        ? Math.round((10000 * focus_votes) / total_valid) / 100
        : 0,
    booth_count: boothNos.length,
    matched_booth_count: matched,
  };
}

/** Recompute place aggregates for any focus candidate (client-side). */
export function recomputePlaceSeries(
  basePlaces: PlaceSeriesEntry[],
  matches: BoothMatches,
  elections: Record<number, ElectionPackage>,
  focusKey: string
): PlaceSeriesEntry[] {
  const years = Object.keys(elections)
    .map(Number)
    .sort((a, b) => a - b);
  return basePlaces.map((p) => {
    const yearStats = years.map((y) =>
      placeYearStats(y, p.booth_nos_2025, matches, elections, focusKey)
    );
    const y20 = yearStats.find((x) => x.year === 2020);
    const y15 = yearStats.find((x) => x.year === 2015);
    const y25 = yearStats.find((x) => x.year === 2025);
    let swing_2020_2025_pp: number | null = null;
    let swing_2015_2025_pp: number | null = null;
    if (
      y20 &&
      y25 &&
      y20.matched_booth_count >= 2 &&
      y20.total_valid > 0 &&
      y25.total_valid > 0
    ) {
      swing_2020_2025_pp =
        Math.round((y25.focus_share_pct - y20.focus_share_pct) * 100) / 100;
    }
    if (
      y15 &&
      y25 &&
      y15.matched_booth_count >= 2 &&
      y15.total_valid > 0 &&
      y25.total_valid > 0
    ) {
      swing_2015_2025_pp =
        Math.round((y25.focus_share_pct - y15.focus_share_pct) * 100) / 100;
    }
    return {
      place: p.place,
      booth_nos_2025: p.booth_nos_2025,
      years: yearStats,
      swing_2020_2025_pp,
      swing_2015_2025_pp,
    };
  });
}

export function buildFocusNarrative(
  focus: FocusOption,
  elections: Record<number, ElectionPackage>
): string[] {
  const pts = focusYearSeries(elections, focus.key);
  const on = pts.filter((p) => p.on_ballot);
  if (!on.length) {
    return [`${focus.name} does not appear in the loaded election years.`];
  }
  const lines: string[] = [];
  lines.push(
    `${focus.name} appears in ${on.map((p) => p.year).join(", ")} with vote shares of ${on
      .map((p) => `${p.share}% (${p.year})`)
      .join(", ")}.`
  );
  const peak = [...on].sort((a, b) => b.votes - a.votes)[0];
  lines.push(
    `Peak votes: ${peak.votes.toLocaleString()} in ${peak.year} (${peak.share}% share).`
  );
  if (on.length >= 2) {
    const first = on[0];
    const last = on[on.length - 1];
    const dShare = Math.round((last.share - first.share) * 100) / 100;
    lines.push(
      `Share change ${first.year}→${last.year}: ${dShare > 0 ? "+" : ""}${dShare} percentage points.`
    );
  }
  return lines;
}

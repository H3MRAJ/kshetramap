import type {
  BoothMatchEntry,
  BoothMatches,
  BoothYearMatch,
  ElectionPackage,
  HistoryBoothRow,
  MatchConfidence,
} from "./historyTypes";

export function getMatchEntry(
  matches: BoothMatches | null,
  boothNo: number
): BoothMatchEntry | null {
  if (!matches) return null;
  return matches.matches.find((m) => m.booth_no_2025 === boothNo) ?? null;
}

export function yearMatch(
  entry: BoothMatchEntry | null,
  year: number
): BoothYearMatch | null {
  if (!entry) return null;
  return entry.by_year[String(year)] ?? null;
}

/** Merge votes for booth keys in an election package. */
export function mergeBoothRows(
  pkg: ElectionPackage,
  keys: string[]
): HistoryBoothRow | null {
  if (!keys.length) return null;
  const rows = pkg.booths.filter((b) => keys.includes(b.booth_key));
  if (!rows.length) return null;
  if (rows.length === 1) return rows[0];

  const votes: Record<string, number> = {};
  let nota = 0;
  let rejected = 0;
  let total_valid = 0;
  let grand_total = 0;
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.votes)) {
      votes[k] = (votes[k] || 0) + v;
    }
    nota += r.nota;
    rejected += r.rejected;
    total_valid += r.total_valid;
    grand_total += r.grand_total;
  }
  const ordered = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const [wkey, wv] = ordered[0] || ["", 0];
  const second = ordered[1]?.[1] ?? 0;
  const wname =
    pkg.candidates.find((c) => c.key === wkey)?.name || wkey;

  return {
    booth_key: keys.join("+"),
    booth_no: rows[0].booth_no,
    suffix: null,
    votes,
    nota,
    rejected,
    total_valid,
    grand_total,
    winner_key: wkey,
    winner_name: wname,
    winner_votes: wv,
    margin: wv - second,
  };
}

export function resolveBoothYear(
  pkg: ElectionPackage | undefined,
  match: BoothYearMatch | null | undefined
): {
  row: HistoryBoothRow | null;
  confidence: MatchConfidence;
} {
  if (!pkg || !match || match.confidence === "unmatched" || !match.keys?.length) {
    return { row: null, confidence: "unmatched" };
  }
  return {
    row: mergeBoothRows(pkg, match.keys),
    confidence: match.confidence,
  };
}

export function focusShare(
  row: HistoryBoothRow | null,
  focusKey: string
): number {
  if (!row || !row.total_valid) return 0;
  return (100 * (row.votes[focusKey] || 0)) / row.total_valid;
}

export type SwingRow = {
  booth_no: number;
  place: string | null;
  share_2020: number;
  share_2025: number;
  swing_pp: number;
  confidence: MatchConfidence;
};

/** Largest focus-candidate swings 2020→2025 among medium+ matches. */
export function topSwings(
  matches: BoothMatches,
  pkg2020: ElectionPackage,
  pkg2025: ElectionPackage,
  focusKey: string,
  limit = 15
): SwingRow[] {
  const rows: SwingRow[] = [];
  for (const m of matches.matches) {
    const y20 = m.by_year["2020"];
    const y25 = m.by_year["2025"];
    if (!y20 || y20.confidence === "unmatched") continue;
    const r20 = mergeBoothRows(pkg2020, y20.keys);
    const r25 = mergeBoothRows(pkg2025, y25?.keys || [String(m.booth_no_2025)]);
    if (!r20 || !r25 || !r20.total_valid || !r25.total_valid) continue;
    const s20 = focusShare(r20, focusKey);
    const s25 = focusShare(r25, focusKey);
    rows.push({
      booth_no: m.booth_no_2025,
      place: m.nearest_place ?? null,
      share_2020: Math.round(s20 * 10) / 10,
      share_2025: Math.round(s25 * 10) / 10,
      swing_pp: Math.round((s25 - s20) * 10) / 10,
      confidence: y20.confidence,
    });
  }
  rows.sort((a, b) => Math.abs(b.swing_pp) - Math.abs(a.swing_pp));
  return rows.slice(0, limit);
}

export function confidenceBadgeClass(c: MatchConfidence): string {
  switch (c) {
    case "high":
      return "bg-emerald-900/60 text-emerald-200 border-emerald-700";
    case "medium":
      return "bg-amber-900/50 text-amber-100 border-amber-700";
    case "low":
      return "bg-orange-950/60 text-orange-200 border-orange-800";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

/** Short label for map/history UI — never expose raw join rules. */
export function confidenceLabel(c: MatchConfidence | string | null | undefined): string {
  switch (c) {
    case "high":
      return "matched";
    case "medium":
      return "approx.";
    case "low":
      return "approx.";
    case "unmatched":
      return "no match";
    default:
      return "";
  }
}
